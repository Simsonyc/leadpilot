import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, formatZodError } from "@/lib/utils";

const updateNextActionSchema = z.object({
  completed: z.boolean().optional(),
  label: z.string().min(1).max(500).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueAt: z.coerce.date().nullable().optional(),
});

type RouteParams = {
  params: Promise<{ id: string; actionId: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id, actionId } = await params;
    const body: unknown = await request.json();

    const parsed = updateNextActionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Payload invalide.", 400, formatZodError(parsed.error));
    }

    const existing = await prisma.leadNextAction.findFirst({
      where: { id: actionId, leadId: id },
    });

    if (!existing) {
      return errorResponse("Action introuvable.", 404);
    }

    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const action = await tx.leadNextAction.update({
        where: { id: actionId },
        data: {
          ...(parsed.data.label !== undefined && { label: parsed.data.label }),
          ...(parsed.data.priority !== undefined && { priority: parsed.data.priority }),
          ...(parsed.data.dueAt !== undefined && { dueAt: parsed.data.dueAt }),
          ...(parsed.data.completed === true && {
            completed: true,
            completedAt: now,
          }),
          ...(parsed.data.completed === false && {
            completed: false,
            completedAt: null,
          }),
        },
      });

      if (typeof parsed.data.completed === "boolean") {
        await tx.leadTimelineEvent.create({
          data: {
            leadId: id,
            type: parsed.data.completed
              ? "NEXT_ACTION_COMPLETED"
              : "NEXT_ACTION_CREATED",
            label: parsed.data.completed
              ? `Action terminée : ${existing.label}`
              : `Action réouverte : ${existing.label}`,
            payload: {
              actionId,
              label: existing.label,
              completed: parsed.data.completed,
            },
          },
        });
      }

      await tx.lead.update({
        where: { id },
        data: { lastActivityAt: now },
      });

      return action;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/leads/[id]/next-actions/[actionId]]", error);
    return errorResponse("Erreur lors de la mise à jour de l'action.");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id, actionId } = await params;

    const existing = await prisma.leadNextAction.findFirst({
      where: { id: actionId, leadId: id },
    });

    if (!existing) {
      return errorResponse("Action introuvable.", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.leadNextAction.delete({ where: { id: actionId } });

      await tx.leadTimelineEvent.create({
        data: {
          leadId: id,
          type: "NEXT_ACTION_DELETED",
          label: `Action supprimée : ${existing.label}`,
          payload: { actionId, label: existing.label },
        },
      });

      await tx.lead.update({
        where: { id },
        data: { lastActivityAt: new Date() },
      });
    });

    return NextResponse.json({ success: true, data: { id: actionId } });
  } catch (error) {
    console.error("[DELETE /api/leads/[id]/next-actions/[actionId]]", error);
    return errorResponse("Erreur lors de la suppression de l'action.");
  }
}
