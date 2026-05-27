import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/utils";

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        verticale: true,
        assignedTo: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: leads,
    });
  } catch (error) {
    console.error("[GET /api/leads]", error);
    return errorResponse("Erreur lors de la récupération des leads.");
  }
}