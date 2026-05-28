import { prisma } from "@/lib/prisma";
import { truncateCommercialLeadContext } from "./context-truncation";
import type { CommercialLeadContext } from "./types";

export async function buildCommercialLeadContext(
  leadId: string,
): Promise<CommercialLeadContext | null> {
  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      deletedAt: null,
    },
    include: {
      verticale: true,
      scores: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      weakSignals: {
        include: {
          weakSignal: true,
        },
        orderBy: [
          {
            weightApplied: "desc",
          },
          {
            confidence: "desc",
          },
        ],
        take: 10,
      },
    },
  });

  if (!lead) {
    return null;
  }

  const latestScore = lead.scores[0] ?? null;

  const context: CommercialLeadContext = {
    lead: {
      id: lead.id,
      name: lead.name,
      contactName: lead.contactName,
      email: lead.email,
      phone: lead.phone,
      website: lead.website,
      source: lead.source,
      sourceChannel: lead.sourceChannel,
      sector: lead.sector,
      city: lead.city,
      department: lead.department,
      notes: lead.notes,
      tags: lead.tags,
      status: lead.status,
      statusReason: lead.statusReason,
      temperature: lead.temperature,
      globalScore: lead.globalScore,
      confidenceScore: lead.confidenceScore,
    },
    verticale: lead.verticale
      ? {
          id: lead.verticale.id,
          name: lead.verticale.name,
          description: lead.verticale.description,
        }
      : null,
    latestScore: latestScore
      ? {
          businessPainScore: latestScore.businessPainScore,
          digitalWeaknessScore: latestScore.digitalWeaknessScore,
          growthPotentialScore: latestScore.growthPotentialScore,
          automationMaturityScore: latestScore.automationMaturityScore,
          urgencyScore: latestScore.urgencyScore,
          visibilityGapScore: latestScore.visibilityGapScore,
          fitVerticaleScore: latestScore.fitVerticaleScore,
          globalScore: latestScore.globalScore,
          explanation: latestScore.explanation,
          createdAt: latestScore.createdAt.toISOString(),
        }
      : null,
    weakSignals: lead.weakSignals.map((signal) => ({
      code: signal.weakSignal.code,
      label: signal.weakSignal.label,
      category: signal.weakSignal.category,
      description: signal.weakSignal.description,
      confidence: signal.confidence,
      evidence: signal.evidence,
      value: signal.value,
      weightApplied: signal.weightApplied,
    })),
  };

  return truncateCommercialLeadContext(context);
}