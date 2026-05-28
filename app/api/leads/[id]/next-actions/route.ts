import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, formatZodError } from "@/lib/utils";

const createNextActionSchema = z.object({
  label: z.string().min(1, "Le libellé est requis.").max(500),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueAt: z.coerce.date().nullable().optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();

    const parsed = createNextActionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Payload invalide.", 400, formatZodError(parsed.error));
    }

    const lead = await prisma.lead.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!lead) {
      return errorResponse("Lead introuvable.", 404);
    }

    const now = new Date();

    const nextAction = await prisma.$transaction(async (tx) => {
      const action = await tx.leadNextAction.create({
        data: {
          leadId: id,
          label: parsed.data.label,
          priority: parsed.data.priority,
          dueAt: parsed.data.dueAt ?? null,
        },
      });

      await tx.leadTimelineEvent.create({
        data: {
          leadId: id,
          type: "NEXT_ACTION_CREATED",
          label: `Action créée : ${parsed.data.label}`,
          payload: {
            actionId: action.id,
            label: parsed.data.label,
            priority: parsed.data.priority,
            dueAt: parsed.data.dueAt ?? null,
          },
        },
      });

      await tx.lead.update({
        where: { id },
        data: { lastActivityAt: now },
      });

      return action;
    });

    return NextResponse.json({ success: true, data: nextAction });
  } catch (error) {
    console.error("[POST /api/leads/[id]/next-actions]", error);
    return errorResponse("Erreur lors de la création de l'action.");
  }
}
