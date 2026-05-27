export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/utils";
import { analyzeLeadWebsiteSignals } from "@/lib/signals/signal-engine";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        website: true,
      },
    });

    if (!lead) {
      return errorResponse("Lead introuvable.", 404);
    }

    if (!lead.website) {
      return errorResponse("Aucun site web n’est renseigné pour ce lead.", 400);
    }

    const result = await analyzeLeadWebsiteSignals({
      leadId: lead.id,
      website: lead.website,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[POST /api/leads/[id]/analyze-signals]", error);

    return errorResponse("Erreur lors de l’analyse des signaux faibles.", 500);
  }
}