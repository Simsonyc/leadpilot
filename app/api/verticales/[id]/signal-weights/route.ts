export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, formatZodError } from "@/lib/utils";

const upsertVerticalSignalWeightSchema = z.object({
  weakSignalId: z.string().min(1, "weakSignalId est obligatoire."),
  weight: z.number().min(0).max(100),
  isActive: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const verticale = await prisma.verticale.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!verticale) {
      return errorResponse("Verticale introuvable.", 404);
    }

    const weights = await prisma.verticalSignalWeight.findMany({
      where: {
        verticaleId: id,
      },
      include: {
        weakSignal: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: weights,
    });
  } catch (error) {
    console.error("[GET /api/verticales/[id]/signal-weights]", error);
    return errorResponse("Erreur lors de la récupération des pondérations.");
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = upsertVerticalSignalWeightSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Payload invalide.", 400, formatZodError(parsed.error));
    }

    const verticale = await prisma.verticale.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!verticale) {
      return errorResponse("Verticale introuvable.", 404);
    }

    const weakSignal = await prisma.weakSignal.findUnique({
      where: {
        id: parsed.data.weakSignalId,
      },
      select: {
        id: true,
      },
    });

    if (!weakSignal) {
      return errorResponse("WeakSignal introuvable.", 404);
    }

    const weight = await prisma.verticalSignalWeight.upsert({
      where: {
        verticaleId_weakSignalId: {
          verticaleId: id,
          weakSignalId: parsed.data.weakSignalId,
        },
      },
      update: {
        weight: parsed.data.weight,
        isActive: parsed.data.isActive ?? true,
        notes: parsed.data.notes ?? null,
      },
      create: {
        verticaleId: id,
        weakSignalId: parsed.data.weakSignalId,
        weight: parsed.data.weight,
        isActive: parsed.data.isActive ?? true,
        notes: parsed.data.notes ?? null,
      },
      include: {
        weakSignal: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: weight,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/verticales/[id]/signal-weights]", error);
    return errorResponse("Erreur lors de l’enregistrement de la pondération.");
  }
}