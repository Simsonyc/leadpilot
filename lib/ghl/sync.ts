import { prisma } from "@/lib/prisma";
import {
  ghlCreateContact,
  ghlUpdateContact,
  ghlGetContact,
  ghlCreateOpportunity,
  ghlUpdateOpportunity,
  ghlCreateNote,
  ghlGetPipelines,
  getLocationId,
} from "./client";
import {
  buildCreateContactPayload,
  buildUpdateContactPayload,
  buildCreateOpportunityPayload,
  buildUpdateOpportunityPayload,
} from "./mappers";
import type { GhlSyncResult } from "@/types/ghl";

// ── Vérification auto sync ─────────────────────────────────────

export function isAutoSyncEnabled(): boolean {
  return process.env.GHL_AUTO_SYNC?.trim().toLowerCase() === "true";
}

// ── Résolution du pipeline et stage GHL ───────────────────────

async function resolvePipelineStage(
  pipelineStage: string,
): Promise<{ pipelineId: string; stageId: string } | null> {
  try {
    const pipelines = await ghlGetPipelines();

    if (pipelines.length === 0) return null;

    // Mapping LeadPilot stage → nom de stage GHL
    const stageNameMap: Record<string, string[]> = {
      TO_CONTACT: ["à contacter", "new", "nouveau", "to contact"],
      QUALIFICATION: ["qualification", "qualify"],
      MEETING: ["meeting", "rendez-vous", "rdv"],
      PROPOSAL: ["proposition", "proposal", "devis"],
      FOLLOW_UP: ["suivi", "follow up", "follow-up", "relance"],
      CLOSING: ["closing", "négociation", "negotiation"],
      LOST: ["perdu", "lost"],
    };

    const targetNames = stageNameMap[pipelineStage] ?? ["new"];

    for (const pipeline of pipelines) {
      for (const stage of pipeline.stages) {
        const stageLower = stage.name.toLowerCase();
        if (targetNames.some((name) => stageLower.includes(name))) {
          return { pipelineId: pipeline.id, stageId: stage.id };
        }
      }
    }

    // Fallback : premier pipeline, première étape
    const firstPipeline = pipelines[0];
    const firstStage = firstPipeline.stages[0];

    if (firstPipeline && firstStage) {
      return { pipelineId: firstPipeline.id, stageId: firstStage.id };
    }

    return null;
  } catch {
    return null;
  }
}

// ── Sync principale ────────────────────────────────────────────

export async function syncLeadToGhl(leadId: string): Promise<GhlSyncResult> {
  const locationId = getLocationId();

  // 1. Récupérer le lead avec sa dernière approche IA
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, deletedAt: null },
    include: {
      aiOutputs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      scores: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!lead) {
    return { success: false, contactId: null, opportunityId: null, action: "skipped", error: "Lead introuvable." };
  }

  try {
    let contactId = lead.ghlContactId ?? null;
    let opportunityId = lead.ghlOpportunityId ?? null;
    let action: "created" | "updated" = "created";

    // 2. Contact GHL
    if (contactId) {
      // Vérifier que le contact existe toujours
      const existing = await ghlGetContact(contactId);

      if (existing) {
        await ghlUpdateContact(contactId, buildUpdateContactPayload(lead));
        action = "updated";
      } else {
        contactId = null;
      }
    }

    if (!contactId) {
      // Créer le contact
      const contact = await ghlCreateContact(
        buildCreateContactPayload(lead, locationId),
      );
      contactId = contact.id;
      action = "created";
    }

    // 3. Résoudre pipeline + stage
    const pipelineStageIds = await resolvePipelineStage(lead.pipelineStage);

    // 4. Opportunity GHL
    if (pipelineStageIds) {
      if (opportunityId) {
        await ghlUpdateOpportunity(
          opportunityId,
          buildUpdateOpportunityPayload(lead, pipelineStageIds.stageId),
        );
      } else {
        const opportunity = await ghlCreateOpportunity(
          buildCreateOpportunityPayload(
            lead,
            contactId,
            pipelineStageIds.pipelineId,
            pipelineStageIds.stageId,
            locationId,
          ),
        );
        opportunityId = opportunity.id;
      }
    }

    // 5. Note IA si une approche a été générée
    const latestAiOutput = lead.aiOutputs[0];
    if (latestAiOutput && action === "created") {
      const noteLines: string[] = ["=== LeadPilot — Approche commerciale IA ===\n"];

      if (latestAiOutput.diagnostic) {
        try {
          const parsed = JSON.parse(latestAiOutput.diagnostic) as Record<string, unknown>;
          if (typeof parsed.miniAudit === "object" && parsed.miniAudit !== null) {
            const audit = parsed.miniAudit as Record<string, unknown>;
            if (typeof audit.summary === "string") {
              noteLines.push(`Mini-audit : ${audit.summary}`);
            }
          }
        } catch {
          // diagnostic non parseable, on ignore
        }
      }

      if (lead.globalScore !== null) {
        noteLines.push(`Score LeadPilot : ${lead.globalScore}/100`);
      }

      if (latestAiOutput.callAngle) {
        noteLines.push(`\nAngle d'appel :\n${latestAiOutput.callAngle}`);
      }

      if (noteLines.length > 1) {
        await ghlCreateNote(contactId, { body: noteLines.join("\n") });
      }
    }

    // 6. Persister les IDs GHL dans le lead
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        ghlContactId: contactId,
        ghlOpportunityId: opportunityId,
        ghlPipelineId: pipelineStageIds?.pipelineId ?? lead.ghlPipelineId,
        ghlStageId: pipelineStageIds?.stageId ?? lead.ghlStageId,
        lastActivityAt: new Date(),
      },
    });

    // 7. Timeline event
    await prisma.leadTimelineEvent.create({
      data: {
        leadId,
        type: "STATUS_CHANGED",
        label: action === "created"
          ? "Lead synchronisé dans GoHighLevel"
          : "Lead mis à jour dans GoHighLevel",
        payload: {
          contactId,
          opportunityId,
          action,
          provider: "ghl",
        },
      },
    });

    return { success: true, contactId, opportunityId, action };
  } catch (error) {
    console.error("[GHL Sync]", error);
    return {
      success: false,
      contactId: lead.ghlContactId ?? null,
      opportunityId: lead.ghlOpportunityId ?? null,
      action: "skipped",
      error: error instanceof Error ? error.message : "Erreur inconnue.",
    };
  }
}
