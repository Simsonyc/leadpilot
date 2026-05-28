import { commercialApproachJsonSchema } from "../schemas/commercial-approach-schema";
import type { AiProviderResult, CommercialLeadContext } from "../types";
import {
  AiEngineError,
  ensureEnv,
  fetchWithTimeout,
  parseJsonObject,
  validateAndSanitizeCommercialApproach,
} from "../utils";
import { createProviderHttpError } from "../provider-error-utils";
import { withAiRetry } from "../retry";
import { commercialSystemPrompt } from "../prompts/commercial-system-prompt";
import { buildCommercialUserPrompt } from "../prompts/commercial-user-prompt";

function extractOpenAiText(response: unknown): string {
  if (
    typeof response === "object" &&
    response !== null &&
    "output_text" in response &&
    typeof response.output_text === "string"
  ) {
    return response.output_text;
  }

  if (typeof response !== "object" || response === null || !("output" in response)) {
    throw new AiEngineError(
      "AI_PROVIDER_RESPONSE_INVALID",
      "Réponse OpenAI inexploitable.",
    );
  }

  const output = (response as { output: unknown }).output;

  if (!Array.isArray(output)) {
    throw new AiEngineError(
      "AI_PROVIDER_RESPONSE_INVALID",
      "Réponse OpenAI sans output exploitable.",
    );
  }

  for (const item of output) {
    if (typeof item !== "object" || item === null || !("content" in item)) {
      continue;
    }

    const content = (item as { content: unknown }).content;

    if (!Array.isArray(content)) {
      continue;
    }

    for (const block of content) {
      if (
        typeof block === "object" &&
        block !== null &&
        "text" in block &&
        typeof block.text === "string"
      ) {
        return block.text;
      }
    }
  }

  throw new AiEngineError(
    "AI_PROVIDER_RESPONSE_INVALID",
    "Aucun JSON trouvé dans la réponse OpenAI.",
  );
}

export async function generateWithOpenAi(
  context: CommercialLeadContext,
): Promise<AiProviderResult> {
  return withAiRetry(
    {
      provider: "openai",
      operation: "generate-commercial-approach",
    },
    async () => {
      const apiKey = ensureEnv("OPENAI_API_KEY");
      const model = process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";

      const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: "system",
              content: commercialSystemPrompt,
            },
            {
              role: "user",
              content: buildCommercialUserPrompt(context),
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "commercial_approach",
              strict: true,
              schema: commercialApproachJsonSchema,
            },
          },
        }),
      });

      const json: unknown = await response.json();

      if (!response.ok) {
        throw createProviderHttpError("openai", response.status, json);
      }

      const approach = validateAndSanitizeCommercialApproach(
        parseJsonObject(extractOpenAiText(json)),
      );

      return {
        provider: "openai",
        modelUsed: model,
        raw: json,
        approach,
      };
    },
  );
}