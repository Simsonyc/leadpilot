import { prisma } from "@/lib/prisma";
import { COMMERCIAL_PROMPT_VERSION } from "./prompts/commercial-system-prompt";
import type { AiProviderResult } from "./types";
import { aiLog } from "./utils";

const COMMERCIAL_APPROACH_SCHEMA_VERSION = "commercial-approach-schema-v1";

export async function persistCommercialApproach(
  leadId: string,
  result: AiProviderResult,
  generationDurationMs: number,
): Promise<string> {
  const output = await prisma.leadAiOutput.create({
    data: {
      leadId,
      channel: "commercial_approach",
      sms: result.approach.sms,
      emailSubject: result.approach.email.subject,
      emailBody: result.approach.email.body,
      linkedinMessage: result.approach.linkedinDm,
      callAngle: result.approach.callAngle,
      diagnostic: JSON.stringify({
        schemaVersion: COMMERCIAL_APPROACH_SCHEMA_VERSION,
        generationDurationMs,
        provider: result.provider,
        modelUsed: result.modelUsed,
        miniAudit: result.approach.miniAudit,
        objections: result.approach.objections,
        cta: result.approach.cta,
        strategy: result.approach.strategy,
      }),
      modelUsed: result.modelUsed,
      provider: result.provider,
      promptVersion: COMMERCIAL_PROMPT_VERSION,
    },
    select: {
      id: true,
    },
  });

  await prisma.lead.update({
    where: {
      id: leadId,
    },
    data: {
      lastActivityAt: new Date(),
    },
  });

  aiLog("info", "persistence success", {
    leadId,
    outputId: output.id,
    provider: result.provider,
    modelUsed: result.modelUsed,
    generationDurationMs,
  });

  return output.id;
}