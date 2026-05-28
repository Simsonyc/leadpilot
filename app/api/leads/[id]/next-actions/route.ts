import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, formatZodError } from "@/lib/utils";

const createNextActionSchema = z.object({
  label: z.string().min(1, "Le libellé est obligatoire."),
  dueAt: z.coerce.date().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const actions = await prisma.leadNextAction.findMany({
      where: {
        leadId: id,
      },
      orderBy: [
        {
          completed: "asc",
        },
        {
          dueAt: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      data: actions,
    });
  } catch (error) {
    console.error("[GET /api/leads/[id]/next-actions]", error);
    return errorResponse("Erreur lors de la récupération des prochaines actions.");
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = createNextActionSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Payload invalide.", 400, formatZodError(parsed.error));
    }

    const existingLead = await prisma.lead.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!existingLead) {
      return errorResponse("Lead introuvable.", 404);
    }

    const action = await prisma.$transaction(async (tx) => {
      const createdAction = await tx.leadNextAction.create({
        data: {
          leadId: id,
          label: parsed.data.label,
          dueAt: parsed.data.dueAt ?? null,
          priority: parsed.data.priority ?? "MEDIUM",
        },
      });

      await tx.leadTimelineEvent.create({
        data: {
          leadId: id,
          type: "NEXT_ACTION_CREATED",
          label: `Prochaine action créée : ${createdAction.label}`,
          payload: {
            actionId: createdAction.id,
            label: createdAction.label,
            dueAt: createdAction.dueAt,
            priority: createdAction.priority,
          },
        },
      });

      await tx.lead.update({
        where: {
          id,
        },
        data: {
          nextActionAt: createdAction.dueAt,
          lastActivityAt: new Date(),
        },
      });

      return createdAction;
    });

    return NextResponse.json(
      {
        success: true,
        data: action,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/leads/[id]/next-actions]", error);
    return errorResponse("Erreur lors de la création de la prochaine action.");
  }
}