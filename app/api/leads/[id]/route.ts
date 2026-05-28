import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, formatZodError } from "@/lib/utils";


const pipelineStageSchema = z.enum([
  "TO_CONTACT",
  "QUALIFICATION",
  "MEETING",
  "PROPOSAL",
  "FOLLOW_UP",
  "CLOSING",
  "LOST",
]);

const updateLeadSchema = z.object({
  status: z
    .enum([
      "NEW",
      "TO_QUALIFY",
      "QUALIFIED",
      "CONTACTED",
      "IN_PROGRESS",
      "WON",
      "LOST",
      "ARCHIVED",
    ])
    .optional(),

  pipelineStage: pipelineStageSchema.optional(),
  temperature: z.enum(["COLD", "WARM", "HOT"]).optional(),

  assignedToId: z.string().nullable().optional(),
  verticaleId: z.string().nullable().optional(),

  sector: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  website: z.string().nullable().optional(),

  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),

  nextActionAt: z.coerce.date().nullable().optional(),
  statusReason: z.string().nullable().optional(),
  confidenceScore: z.number().min(0).max(100).nullable().optional(),
});

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

function buildLeadChangeEvents(args: {
  leadId: string;
  previous: {
    status: string;
    pipelineStage: string;
    notes: string | null;
    nextActionAt: Date | null;
  };
  next: {
    status?: string;
    pipelineStage?: string;
    notes?: string | null;
    nextActionAt?: Date | null;
  };
}) {
  const events: Array<{
    leadId: string;
    type:
      | "STATUS_CHANGED"
      | "NOTE_ADDED"
      | "NEXT_ACTION_CREATED"
      | "NEXT_ACTION_DELETED";
    label: string;
    payload: Prisma.InputJsonValue;
  }> = [];

  if (args.next.status && args.next.status !== args.previous.status) {
    events.push({
      leadId: args.leadId,
      type: "STATUS_CHANGED",
      label: `Statut modifié : ${args.previous.status} → ${args.next.status}`,
      payload: {
        field: "status",
        from: args.previous.status,
        to: args.next.status,
      },
    });
  }

  if (
    args.next.pipelineStage &&
    args.next.pipelineStage !== args.previous.pipelineStage
  ) {
    events.push({
      leadId: args.leadId,
      type: "STATUS_CHANGED",
      label: `Pipeline modifié : ${args.previous.pipelineStage} → ${args.next.pipelineStage}`,
      payload: {
        field: "pipelineStage",
        from: args.previous.pipelineStage,
        to: args.next.pipelineStage,
      },
    });
  }

  if (
    typeof args.next.notes !== "undefined" &&
    args.next.notes !== args.previous.notes &&
    args.next.notes !== null &&
    args.next.notes.trim().length > 0
  ) {
    events.push({
      leadId: args.leadId,
      type: "NOTE_ADDED",
      label: "Note mise à jour",
      payload: {
        notes: args.next.notes,
      },
    });
  }

  if (
    typeof args.next.nextActionAt !== "undefined" &&
    String(args.next.nextActionAt) !== String(args.previous.nextActionAt)
  ) {
    events.push({
      leadId: args.leadId,
      type: args.next.nextActionAt ? "NEXT_ACTION_CREATED" : "NEXT_ACTION_DELETED",
      label: args.next.nextActionAt
        ? "Prochaine action planifiée"
        : "Prochaine action supprimée",
      payload: {
  from: args.previous.nextActionAt
    ? args.previous.nextActionAt.toISOString()
    : null,
  to: args.next.nextActionAt
    ? args.next.nextActionAt.toISOString()
    : null,
},
    });
  }

  return events;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        verticale: true,
        assignedTo: true,
        scores: {
          orderBy: {
            createdAt: "desc",
          },
        },
        weakSignals: {
          include: {
            weakSignal: true,
          },
        },
        aiOutputs: {
          orderBy: {
            createdAt: "desc",
          },
        },
        events: {
          orderBy: {
            occurredAt: "desc",
          },
        },
        actions: {
          orderBy: {
            createdAt: "desc",
          },
        },
        timelineEvents: {
          orderBy: {
            createdAt: "desc",
          },
        },
        nextActions: {
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
        },
      },
    });

    if (!lead) {
      return errorResponse("Lead introuvable.", 404);
    }

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error("[GET /api/leads/[id]]", error);
    return errorResponse("Erreur lors de la récupération du lead.");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = updateLeadSchema.safeParse(body);

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
        status: true,
        pipelineStage: true,
        notes: true,
        nextActionAt: true,
      },
    });

    if (!existingLead) {
      return errorResponse("Lead introuvable.", 404);
    }

    const now = new Date();

    const timelineEvents = buildLeadChangeEvents({
      leadId: id,
      previous: {
        status: existingLead.status,
        pipelineStage: existingLead.pipelineStage,
        notes: existingLead.notes,
        nextActionAt: existingLead.nextActionAt,
      },
      next: {
        status: parsed.data.status,
        pipelineStage: parsed.data.pipelineStage,
        notes: parsed.data.notes,
        nextActionAt: parsed.data.nextActionAt,
      },
    });

    const updatedLead = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.update({
        where: {
          id,
        },
        data: {
          ...parsed.data,
          lastActivityAt: now,
        },
      });

      if (timelineEvents.length > 0) {
        await tx.leadTimelineEvent.createMany({
          data: timelineEvents,
        });
      }

      return lead;
    });

    return NextResponse.json({
      success: true,
      data: updatedLead,
    });
  } catch (error) {
    console.error("[PATCH /api/leads/[id]]", error);
    return errorResponse("Erreur lors de la modification du lead.");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    const now = new Date();

    const deletedLead = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.update({
        where: {
          id,
        },
        data: {
          deletedAt: now,
          isArchived: true,
          status: "ARCHIVED",
          pipelineStage: "LOST",
          lastActivityAt: now,
        },
      });

      await tx.leadTimelineEvent.create({
        data: {
          leadId: id,
          type: "STATUS_CHANGED",
          label: "Lead archivé",
          payload: {
            status: "ARCHIVED",
            pipelineStage: "LOST",
          },
        },
      });

      return lead;
    });

    return NextResponse.json({
      success: true,
      data: deletedLead,
    });
  } catch (error) {
    console.error("[DELETE /api/leads/[id]]", error);
    return errorResponse("Erreur lors de la suppression du lead.");
  }
}