export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/utils";
import { scoreLead } from "@/lib/scoring/score-engine";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const result = await scoreLead(id);

    if (!result) {
      return errorResponse("Lead introuvable.", 404);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[POST /api/leads/[id]/score]", error);

    return errorResponse("Erreur lors du calcul du score du lead.", 500);
  }
}