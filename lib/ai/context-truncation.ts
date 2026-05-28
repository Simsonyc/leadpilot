import type { CommercialLeadContext } from "./types";

const DEFAULT_MAX_CONTEXT_CHARS = 18_000;
const REDUCED_MAX_CONTEXT_CHARS = 12_000;

function cleanText(value: string | null): string | null {
  if (!value) return null;

  const cleaned = value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned.length > 0 ? cleaned : null;
}

function truncate(value: string | null, maxChars: number): string | null {
  const cleaned = cleanText(value);

  if (!cleaned) return null;

  return cleaned.length > maxChars ? `${cleaned.slice(0, maxChars)}…` : cleaned;
}

function truncateArray(values: string[], maxItems: number, maxChars: number): string[] {
  return values
    .map((value) => truncate(value, maxChars))
    .filter((value): value is string => Boolean(value))
    .slice(0, maxItems);
}

export function estimateContextSize(context: CommercialLeadContext): number {
  return JSON.stringify(context).length;
}

export function truncateCommercialLeadContext(
  context: CommercialLeadContext,
  maxContextChars = DEFAULT_MAX_CONTEXT_CHARS,
): CommercialLeadContext {
  const optimized: CommercialLeadContext = {
    ...context,
    lead: {
      ...context.lead,
      notes: truncate(context.lead.notes, 1800),
      statusReason: truncate(context.lead.statusReason, 500),
      tags: truncateArray(context.lead.tags, 12, 60),
    },
    verticale: context.verticale
      ? {
          ...context.verticale,
          description: truncate(context.verticale.description, 600),
        }
      : null,
    latestScore: context.latestScore
      ? {
          ...context.latestScore,
          explanation: truncate(context.latestScore.explanation, 1200),
        }
      : null,
    weakSignals: context.weakSignals.slice(0, 10).map((signal) => ({
      ...signal,
      description: truncate(signal.description, 500),
      evidence: truncate(signal.evidence, 600),
      value: truncate(signal.value, 250),
    })),
  };

  if (estimateContextSize(optimized) <= maxContextChars) {
    return optimized;
  }

  const reduced: CommercialLeadContext = {
    ...optimized,
    lead: {
      ...optimized.lead,
      notes: truncate(optimized.lead.notes, 900),
      statusReason: truncate(optimized.lead.statusReason, 300),
      tags: truncateArray(optimized.lead.tags, 8, 40),
    },
    verticale: optimized.verticale
      ? {
          ...optimized.verticale,
          description: truncate(optimized.verticale.description, 300),
        }
      : null,
    latestScore: optimized.latestScore
      ? {
          ...optimized.latestScore,
          explanation: truncate(optimized.latestScore.explanation, 600),
        }
      : null,
    weakSignals: optimized.weakSignals.slice(0, 7).map((signal) => ({
      ...signal,
      description: truncate(signal.description, 250),
      evidence: truncate(signal.evidence, 300),
      value: truncate(signal.value, 120),
    })),
  };

  if (estimateContextSize(reduced) <= REDUCED_MAX_CONTEXT_CHARS) {
    return reduced;
  }

  return {
    ...reduced,
    lead: {
      ...reduced.lead,
      notes: truncate(reduced.lead.notes, 500),
    },
    latestScore: reduced.latestScore
      ? {
          ...reduced.latestScore,
          explanation: truncate(reduced.latestScore.explanation, 350),
        }
      : null,
    weakSignals: reduced.weakSignals.slice(0, 5).map((signal) => ({
      ...signal,
      description: truncate(signal.description, 150),
      evidence: truncate(signal.evidence, 150),
      value: truncate(signal.value, 80),
    })),
  };
}