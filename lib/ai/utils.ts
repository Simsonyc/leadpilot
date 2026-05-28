import {
  commercialApproachSchema,
  type CommercialApproach,
} from "./schemas/commercial-approach-schema";
import type { AiProviderName, StableAiErrorCode } from "./types";

export const AI_PROVIDER_TIMEOUT_MS = 45_000;

export class AiEngineError extends Error {
  code: StableAiErrorCode;
  details?: unknown;

  constructor(code: StableAiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AiEngineError";
    this.code = code;
    this.details = details;
  }
}

export function aiLog(
  level: "info" | "warn" | "error",
  message: string,
  details?: unknown,
) {
  const payload = {
    scope: "AI Commercial Engine",
    message,
    details,
  };

  if (level === "error") {
    console.error("[AI Commercial Engine]", payload);
    return;
  }

  if (level === "warn") {
    console.warn("[AI Commercial Engine]", payload);
    return;
  }

  console.info("[AI Commercial Engine]", payload);
}

export function getAiProviderName(): AiProviderName {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (provider === "claude") {
    return "claude";
  }

  return "openai";
}

export function getFallbackProviderName(): AiProviderName | null {
  const provider = process.env.AI_FALLBACK_PROVIDER?.trim().toLowerCase();

  if (provider === "openai" || provider === "claude") {
    return provider;
  }

  return null;
}

export function ensureEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new AiEngineError(
      "AI_PROVIDER_NOT_CONFIGURED",
      `Variable d’environnement manquante : ${name}`,
    );
  }

  return value;
}

export function parseJsonObject(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new AiEngineError(
      "AI_PROVIDER_RESPONSE_INVALID",
      "La réponse IA n’est pas un JSON valide.",
    );
  }
}

export function validateCommercialApproach(value: unknown): CommercialApproach {
  const parsed = commercialApproachSchema.safeParse(value);

  if (!parsed.success) {
    aiLog("warn", "validation failed", parsed.error.issues);

    throw new AiEngineError(
      "AI_PROVIDER_RESPONSE_INVALID",
      "La réponse IA ne respecte pas le schéma CommercialApproach.",
      parsed.error.issues,
    );
  }

  return parsed.data;
}

function stripCodeFences(value: string): string {
  return value
    .replace(/^```(?:json|html|text|markdown)?/i, "")
    .replace(/```$/i, "");
}

function stripDangerousHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/on\w+=["'][\s\S]*?["']/gi, "")
    .replace(/javascript:/gi, "");
}

function normalizeText(value: string): string {
  return stripDangerousHtml(stripCodeFences(value))
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeStringArray(values: string[]): string[] {
  return values.map(normalizeText).filter((value) => value.length > 0);
}

export function sanitizeCommercialApproach(
  approach: CommercialApproach,
): CommercialApproach {
  const sanitized: CommercialApproach = {
    email: {
      subject: normalizeText(approach.email.subject),
      body: normalizeText(approach.email.body),
    },
    sms: normalizeText(approach.sms),
    linkedinDm: normalizeText(approach.linkedinDm),
    callAngle: normalizeText(approach.callAngle),
    miniAudit: {
      summary: normalizeText(approach.miniAudit.summary),
      findings: normalizeStringArray(approach.miniAudit.findings),
      quickWins: normalizeStringArray(approach.miniAudit.quickWins),
      risks: normalizeStringArray(approach.miniAudit.risks),
    },
    objections: approach.objections
      .map((objection) => ({
        objection: normalizeText(objection.objection),
        response: normalizeText(objection.response),
      }))
      .filter(
        (objection) =>
          objection.objection.length > 0 && objection.response.length > 0,
      ),
    cta: {
      primary: normalizeText(approach.cta.primary),
      secondary: normalizeText(approach.cta.secondary),
    },
    strategy: {
      dominantPain: normalizeText(approach.strategy.dominantPain),
      urgencyLevel: Math.max(0, Math.min(100, approach.strategy.urgencyLevel)),
      prioritySignals: normalizeStringArray(approach.strategy.prioritySignals),
      recommendedAngle: normalizeText(approach.strategy.recommendedAngle),
      recommendedOfferType: normalizeText(approach.strategy.recommendedOfferType),
    },
  };

  return validateCommercialApproach(sanitized);
}

export function validateAndSanitizeCommercialApproach(
  value: unknown,
): CommercialApproach {
  const validated = validateCommercialApproach(value);
  return sanitizeCommercialApproach(validated);
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = AI_PROVIDER_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AiEngineError(
        "AI_PROVIDER_TIMEOUT",
        "AI_PROVIDER_TIMEOUT",
        { timeoutMs },
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}