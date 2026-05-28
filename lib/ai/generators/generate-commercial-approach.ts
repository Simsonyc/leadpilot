import { generateWithClaude } from "../providers/claude";
import { generateWithOpenAi } from "../providers/openai";
import type { AiProviderName, AiProviderResult, CommercialLeadContext } from "../types";
import { AiEngineError, aiLog, getAiProviderName, getFallbackProviderName } from "../utils";

async function generateWithProvider(
  provider: AiProviderName,
  context: CommercialLeadContext,
): Promise<AiProviderResult> {
  if (provider === "claude") {
    return generateWithClaude(context);
  }

  return generateWithOpenAi(context);
}

export async function generateCommercialApproach(
  context: CommercialLeadContext,
): Promise<AiProviderResult> {
  const primaryProvider = getAiProviderName();
  const fallbackProvider = getFallbackProviderName();

  try {
    const result = await generateWithProvider(primaryProvider, context);

    aiLog("info", "provider used", {
      provider: result.provider,
      modelUsed: result.modelUsed,
      fallbackUsed: false,
    });

    return result;
  } catch (primaryError) {
    aiLog("warn", "primary provider failed", {
      provider: primaryProvider,
      error: primaryError,
    });

    if (!fallbackProvider || fallbackProvider === primaryProvider) {
      if (primaryError instanceof AiEngineError) {
        throw primaryError;
      }

      throw new AiEngineError(
        "AI_GENERATION_FAILED",
        "La génération IA a échoué.",
        primaryError,
      );
    }

    try {
      const result = await generateWithProvider(fallbackProvider, context);

      aiLog("warn", "fallback provider used", {
        primaryProvider,
        fallbackProvider,
        modelUsed: result.modelUsed,
      });

      return result;
    } catch (fallbackError) {
      aiLog("error", "fallback provider failed", {
        primaryProvider,
        fallbackProvider,
        primaryError,
        fallbackError,
      });

      throw new AiEngineError(
        fallbackError instanceof AiEngineError
          ? fallbackError.code
          : "AI_GENERATION_FAILED",
        "La génération IA a échoué sur le provider principal et le fallback.",
        {
          primaryProvider,
          fallbackProvider,
          primaryError,
          fallbackError,
        },
      );
    }
  }
}