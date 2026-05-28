import { buildCommercialLeadContext } from "./context-builder";
import { generateCommercialApproach } from "./generators/generate-commercial-approach";
import { persistCommercialApproach } from "./persistence";
import type { PersistedCommercialApproach } from "./types";
import { aiLog } from "./utils";

export async function generateAndPersistCommercialApproach(
  leadId: string,
): Promise<PersistedCommercialApproach | null> {
  const startedAt = Date.now();

  const context = await buildCommercialLeadContext(leadId);

  if (!context) {
    return null;
  }

  const result = await generateCommercialApproach(context);
  const generationDurationMs = Date.now() - startedAt;

  const persistedOutputId = await persistCommercialApproach(
    leadId,
    result,
    generationDurationMs,
  );

  aiLog("info", "generation completed", {
    leadId,
    provider: result.provider,
    modelUsed: result.modelUsed,
    generationDurationMs,
  });

  return {
    ...result.approach,
    persistedOutputId,
    provider: result.provider,
    modelUsed: result.modelUsed,
    generationDurationMs,
  };
}