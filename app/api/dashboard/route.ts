import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/utils";

export async function GET() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalLeads,
      hotLeads,
      leadsWithoutAction,
      overdueActions,
      stagnantLeads,
      recentAiOutputs,
      recentTimelineEvents,
      priorityLeads,
      upcomingActions,
      pipelineCounts,
    ] = await Promise.all([
      // Total leads actifs
      prisma.lead.count({
        where: { deletedAt: null, isArchived: false },
      }),

      // Leads HOT
      prisma.lead.count({
        where: { deletedAt: null, isArchived: false, temperature: "HOT" },
      }),

      // Leads sans aucune action planifiée
      prisma.lead.count({
        where: {
          deletedAt: null,
          isArchived: false,
          nextActions: { none: { completed: false } },
          nextActionAt: null,
        },
      }),

      // Next actions en retard
      prisma.leadNextAction.count({
        where: {
          completed: false,
          dueAt: { lt: now },
          lead: { deletedAt: null, isArchived: false },
        },
      }),

      // Leads sans activité depuis 14 jours
      prisma.lead.count({
        where: {
          deletedAt: null,
          isArchived: false,
          lastActivityAt: { lt: fourteenDaysAgo },
        },
      }),

      // Activité IA cette semaine
      prisma.leadAiOutput.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),

      // Derniers événements timeline (feed activité)
      prisma.leadTimelineEvent.findMany({
        where: { lead: { deletedAt: null, isArchived: false } },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          lead: {
            select: { id: true, name: true, pipelineStage: true },
          },
        },
      }),

      // Leads prioritaires — HOT ou score élevé, non archivés
      prisma.lead.findMany({
        where: {
          deletedAt: null,
          isArchived: false,
          OR: [
            { temperature: "HOT" },
            { globalScore: { gte: 70 } },
          ],
        },
        orderBy: [
          { temperature: "desc" },
          { globalScore: "desc" },
          { lastActivityAt: "desc" },
        ],
        take: 5,
        select: {
          id: true,
          name: true,
          sector: true,
          city: true,
          temperature: true,
          globalScore: true,
          pipelineStage: true,
          status: true,
          lastActivityAt: true,
          nextActionAt: true,
        },
      }),

      // Prochaines relances dans les 7 jours
      prisma.leadNextAction.findMany({
        where: {
          completed: false,
          dueAt: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
          lead: { deletedAt: null, isArchived: false },
        },
        orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
        take: 5,
        include: {
          lead: {
            select: { id: true, name: true, pipelineStage: true },
          },
        },
      }),

      // Répartition pipeline
      prisma.lead.groupBy({
        by: ["pipelineStage"],
        where: { deletedAt: null, isArchived: false },
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalLeads,
          hotLeads,
          leadsWithoutAction,
          overdueActions,
          stagnantLeads,
          recentAiOutputs,
        },
        recentActivity: recentTimelineEvents,
        priorityLeads,
        upcomingActions,
        pipeline: pipelineCounts.map((item) => ({
          stage: item.pipelineStage,
          count: item._count._all,
        })),
      },
    });
  } catch (error) {
    console.error("[GET /api/dashboard]", error);
    return errorResponse("Erreur lors du chargement du dashboard.");
  }
}
