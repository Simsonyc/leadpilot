export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, formatZodError } from "@/lib/utils";

const updateVerticalSignalWeightSchema = z.object({
  weight: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

type RouteParams = {
  params: Promise<{
    id: string;
    weightId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id, weightId } = await params;
    const body = await request.json();

    const parsed = updateVerticalSignalWeightSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Payload invalide.", 400, formatZodError(parsed.error));
    }

    const existingWeight = await prisma.verticalSignalWeight.findFirst({
      where: {
        id: weightId,
        verticaleId: id,
      },
      select: {
        id: true,
      },
    });

    if (!existingWeight) {
      return errorResponse("Pondération introuvable.", 404);
    }

    const updatedWeight = await prisma.verticalSignalWeight.update({
      where: {
        id: weightId,
      },
      data: parsed.data,
      include: {
        weakSignal: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedWeight,
    });
  } catch (error) {
    console.error("[PATCH /api/verticales/[id]/signal-weights/[weightId]]", error);
    return errorResponse("Erreur lors de la modification de la pondération.");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id, weightId } = await params;

    const existingWeight = await prisma.verticalSignalWeight.findFirst({
      where: {
        id: weightId,
        verticaleId: id,
      },
      select: {
        id: true,
      },
    });

    if (!existingWeight) {
      return errorResponse("Pondération introuvable.", 404);
    }

    const disabledWeight = await prisma.verticalSignalWeight.update({
      where: {
        id: weightId,
      },
      data: {
        isActive: false,
      },
      include: {
        weakSignal: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: disabledWeight,
    });
  } catch (error) {
    console.error("[DELETE /api/verticales/[id]/signal-weights/[weightId]]", error);
    return errorResponse("Erreur lors de la désactivation de la pondération.");
  }
}