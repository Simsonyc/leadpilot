import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, formatZodError } from "@/lib/utils";

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
      },
    });

    if (!existingLead) {
      return errorResponse("Lead introuvable.", 404);
    }

    const updatedLead = await prisma.lead.update({
      where: {
        id,
      },
      data: parsed.data,
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

    const deletedLead = await prisma.lead.update({
      where: {
        id,
      },
      data: {
        deletedAt: now,
        isArchived: true,
        status: "ARCHIVED",
        lastActivityAt: now,
      },
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