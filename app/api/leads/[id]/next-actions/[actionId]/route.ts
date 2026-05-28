import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, formatZodError } from "@/lib/utils";

const updateNextActionSchema = z.object({
  label: z.string().min(1).optional(),
  dueAt: z.coerce.date().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  completed: z.boolean().optional(),
});

type RouteParams = {
  params: Promise<{
    id: string;
    actionId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id, actionId } = await params;
    const body = await request.json();

    const parsed = updateNextActionSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Payload invalide.", 400, formatZodError(parsed.error));
    }

    const existingAction = await prisma.leadNextAction.findFirst({
      where: {
        id: actionId,
        leadId: id,
      },
      select: {
        id: true,
        label: true,
        completed: true,
      },
    });

    if (!existingAction) {
      return errorResponse("Action introuvable.", 404);
    }

    const completedAt =
      parsed.data.completed === true && !existingAction.completed
        ? new Date()
        : parsed.data.completed === false
          ? null
          : undefined;

    const action = await prisma.$transaction(async (tx) => {
      const updatedAction = await tx.leadNextAction.update({
        where: {
          id: actionId,
        },
        data: {
          ...parsed.data,
          completedAt,
        },
      });

      if (parsed.data.completed === true && !existingAction.completed) {
        await tx.leadTimelineEvent.create({
          data: {
            leadId: id,
            type: "NEXT_ACTION_COMPLETED",
            label: `Action terminée : ${updatedAction.label}`,
            payload: {
              actionId: updatedAction.id,
              label: updatedAction.label,
            },
          },
        });
      }

      await tx.lead.update({
        where: {
          id,
        },
        data: {
          lastActivityAt: new Date(),
        },
      });

      return updatedAction;
    });

    return NextResponse.json({
      success: true,
      data: action,
    });
  } catch (error) {
    console.error("[PATCH /api/leads/[id]/next-actions/[actionId]]", error);
    return errorResponse("Erreur lors de la modification de l’action.");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id, actionId } = await params;

    const existingAction = await prisma.leadNextAction.findFirst({
      where: {
        id: actionId,
        leadId: id,
      },
      select: {
        id: true,
        label: true,
      },
    });

    if (!existingAction) {
      return errorResponse("Action introuvable.", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.leadNextAction.delete({
        where: {
          id: actionId,
        },
      });

      await tx.leadTimelineEvent.create({
        data: {
          leadId: id,
          type: "NEXT_ACTION_DELETED",
          label: `Action supprimée : ${existingAction.label}`,
          payload: {
            actionId,
            label: existingAction.label,
            deleted: true,
          },
        },
      });

      await tx.lead.update({
        where: {
          id,
        },
        data: {
          lastActivityAt: new Date(),
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        id: actionId,
        deleted: true,
      },
    });
  } catch (error) {
    console.error("[DELETE /api/leads/[id]/next-actions/[actionId]]", error);
    return errorResponse("Erreur lors de la suppression de l’action.");
  }
}