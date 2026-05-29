import { commercialApproachJsonSchema } from "../schemas/commercial-approach-schema";
import type { AiProviderResult, CommercialLeadContext } from "../types";
import {
  AiEngineError,
  ensureEnv,
  fetchWithTimeout,
  validateAndSanitizeCommercialApproach,
} from "../utils";
import { createProviderHttpError } from "../provider-error-utils";
import { withAiRetry } from "../retry";
import { commercialSystemPrompt } from "../prompts/commercial-system-prompt";
import { buildCommercialUserPrompt } from "../prompts/commercial-user-prompt";

function extractClaudeToolInput(response: unknown): unknown {
  if (typeof response !== "object" || response === null || !("content" in response)) {
    throw new AiEngineError(
      "AI_PROVIDER_RESPONSE_INVALID",
      "Réponse Claude inexploitable.",
    );
  }

  const content = (response as { content: unknown }).content;

  if (!Array.isArray(content)) {
    throw new AiEngineError(
      "AI_PROVIDER_RESPONSE_INVALID",
      "Réponse Claude sans contenu exploitable.",
    );
  }

  for (const block of content) {
    if (
      typeof block === "object" &&
      block !== null &&
      "type" in block &&
      block.type === "tool_use" &&
      "name" in block &&
      block.name === "return_commercial_approach" &&
      "input" in block
    ) {
      return block.input;
    }
  }

  throw new AiEngineError(
    "AI_PROVIDER_RESPONSE_INVALID",
    "Claude n’a pas retourné l’outil structuré attendu.",
  );
}

export async function generateWithClaude(
  context: CommercialLeadContext,
): Promise<AiProviderResult> {
  return withAiRetry(
    {
      provider: "claude",
      operation: "generate-commercial-approach",
    },
    async () => {
      const apiKey = ensureEnv("ANTHROPIC_API_KEY");
      const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";

      const response = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 3000,
          system: commercialSystemPrompt,
          messages: [
            {
              role: "user",
              content: buildCommercialUserPrompt(context),
            },
          ],
          tools: [
            {
              name: "return_commercial_approach",
              description:
                "Retourne l’approche commerciale LeadPilot sous forme strictement structurée.",
              input_schema: commercialApproachJsonSchema,
            },
          ],
          tool_choice: {
            type: "tool",
            name: "return_commercial_approach",
          },
        }),
      });

      const json: unknown = await response.json();

      if (!response.ok) {
        throw createProviderHttpError("claude", response.status, json);
      }

      const approach = validateAndSanitizeCommercialApproach(
        extractClaudeToolInput(json),
      );

      return {
        provider: "claude",
        modelUsed: model,
        raw: json,
        approach,
      };
    },
  );
}