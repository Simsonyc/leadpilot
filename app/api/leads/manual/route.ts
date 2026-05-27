import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, formatZodError } from "@/lib/utils";

const createManualLeadSchema = z.object({
  name: z.string().min(1, "Le nom du lead est obligatoire."),

  contactName: z.string().optional().nullable(),
  email: z.string().email("Email invalide.").optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),

  source: z.string().optional().nullable(),
  sourceChannel: z.string().optional().nullable(),

  sector: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  department: z.string().optional().nullable(),

  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),

  verticaleId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = createManualLeadSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Payload invalide.", 400, formatZodError(parsed.error));
    }

    const lead = await prisma.lead.create({
      data: {
        ...parsed.data,
        source: parsed.data.source ?? "manual",
        sourceChannel: parsed.data.sourceChannel ?? "manual",
        tags: parsed.data.tags ?? [],
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: lead,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/leads/manual]", error);
    return errorResponse("Erreur lors de la création du lead.");
  }
}