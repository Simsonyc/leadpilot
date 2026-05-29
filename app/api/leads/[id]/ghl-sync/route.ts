export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/utils";
import { syncLeadToGhl, isAutoSyncEnabled } from "@/lib/ghl/sync";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// ── Sync manuelle ──────────────────────────────────────────────

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const lead = await prisma.lead.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!lead) {
      return errorResponse("Lead introuvable.", 404);
    }

    const result = await syncLeadToGhl(id);

    if (!result.success) {
      return errorResponse(result.error ?? "Synchronisation GHL échouée.", 500);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[POST /api/leads/[id]/ghl-sync]", error);
    return errorResponse("Erreur lors de la synchronisation GHL.");
  }
}

// ── Statut sync + toggle auto ──────────────────────────────────

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const lead = await prisma.lead.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        ghlContactId: true,
        ghlOpportunityId: true,
        ghlPipelineId: true,
        ghlStageId: true,
      },
    });

    if (!lead) {
      return errorResponse("Lead introuvable.", 404);
    }

    return NextResponse.json({
      success: true,
      data: {
        synced: Boolean(lead.ghlContactId),
        autoSyncEnabled: isAutoSyncEnabled(),
        ghlContactId: lead.ghlContactId,
        ghlOpportunityId: lead.ghlOpportunityId,
        ghlPipelineId: lead.ghlPipelineId,
        ghlStageId: lead.ghlStageId,
      },
    });
  } catch (error) {
    console.error("[GET /api/leads/[id]/ghl-sync]", error);
    return errorResponse("Erreur lors de la récupération du statut GHL.");
  }
}
