export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/utils";
import { generateAndPersistCommercialApproach } from "@/lib/ai/orchestrator";
import { AiEngineError, aiLog } from "@/lib/ai/utils";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const result = await generateAndPersistCommercialApproach(id);

    if (!result) {
      return errorResponse("Lead introuvable.", 404);
    }

    return NextResponse.json({
      success: true,
      data: {
        emailSubject: result.email.subject,
        emailBody: result.email.body,
        sms: result.sms,
        linkedinMessage: result.linkedinDm,
        callAngle: result.callAngle,
        miniAudit: result.miniAudit,
        objections: result.objections,
        cta: result.cta,
        provider: result.provider,
        modelUsed: result.modelUsed,
        generationDurationMs: result.generationDurationMs,
      },
    });
  } catch (error) {
    aiLog("error", "route generation failed", error);

    if (error instanceof AiEngineError) {
      return errorResponse(error.code, 500, error.details);
    }

    return errorResponse("AI_GENERATION_FAILED", 500);
  }
}