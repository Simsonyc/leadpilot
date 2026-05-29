import type {
  GhlCreateContactPayload,
  GhlUpdateContactPayload,
  GhlCreateOpportunityPayload,
  GhlUpdateOpportunityPayload,
} from "@/types/ghl";

type LeadForGhl = {
  name: string;
  email: string | null;
  phone: string | null;
  sector: string | null;
  city: string | null;
  tags: string[];
  globalScore: number | null;
  temperature: string;
  pipelineStage: string;
  status: string;
  notes: string | null;
  source: string | null;
  sourceChannel: string | null;
};

// ── Mapping température → tag GHL ─────────────────────────────

function temperatureTag(temperature: string): string {
  const map: Record<string, string> = {
    HOT: "leadpilot-hot",
    WARM: "leadpilot-warm",
    COLD: "leadpilot-cold",
  };
  return map[temperature] ?? "leadpilot-cold";
}

// ── Mapping pipeline stage → statut GHL opportunity ───────────

export function pipelineStageToGhlStatus(
  stage: string,
): "open" | "won" | "lost" | "abandoned" {
  if (stage === "CLOSING") return "open";
  if (stage === "LOST") return "lost";
  return "open";
}

// ── Découpage nom complet ──────────────────────────────────────

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  const firstName = parts.slice(0, -1).join(" ");
  const lastName = parts[parts.length - 1];
  return { firstName, lastName };
}

// ── Contact ───────────────────────────────────────────────────

export function buildCreateContactPayload(
  lead: LeadForGhl,
  locationId: string,
): GhlCreateContactPayload {
  const { firstName, lastName } = splitName(lead.name);

  const tags = [
    "leadpilot",
    temperatureTag(lead.temperature),
    ...(lead.sector ? [`secteur-${lead.sector.toLowerCase()}`] : []),
    ...(lead.tags ?? []),
  ];

  return {
    locationId,
    firstName,
    lastName: lastName || undefined,
    email: lead.email ?? undefined,
    phone: lead.phone ?? undefined,
    tags,
    source: lead.sourceChannel ?? lead.source ?? "leadpilot",
    customFields: [
      {
        id: "leadpilot_score",
        value: lead.globalScore !== null ? String(lead.globalScore) : null,
      },
      {
        id: "leadpilot_temperature",
        value: lead.temperature,
      },
      {
        id: "leadpilot_stage",
        value: lead.pipelineStage,
      },
      {
        id: "leadpilot_city",
        value: lead.city,
      },
    ],
  };
}

export function buildUpdateContactPayload(
  lead: LeadForGhl,
): GhlUpdateContactPayload {
  const { firstName, lastName } = splitName(lead.name);

  const tags = [
    "leadpilot",
    temperatureTag(lead.temperature),
    ...(lead.sector ? [`secteur-${lead.sector.toLowerCase()}`] : []),
    ...(lead.tags ?? []),
  ];

  return {
    firstName,
    lastName: lastName || undefined,
    email: lead.email ?? undefined,
    phone: lead.phone ?? undefined,
    tags,
    customFields: [
      {
        id: "leadpilot_score",
        value: lead.globalScore !== null ? String(lead.globalScore) : null,
      },
      {
        id: "leadpilot_temperature",
        value: lead.temperature,
      },
      {
        id: "leadpilot_stage",
        value: lead.pipelineStage,
      },
    ],
  };
}

// ── Opportunity ───────────────────────────────────────────────

export function buildCreateOpportunityPayload(
  lead: LeadForGhl,
  contactId: string,
  pipelineId: string,
  stageId: string,
  locationId: string,
): GhlCreateOpportunityPayload {
  return {
    pipelineId,
    locationId,
    name: lead.name,
    pipelineStageId: stageId,
    status: pipelineStageToGhlStatus(lead.pipelineStage),
    contactId,
  };
}

export function buildUpdateOpportunityPayload(
  lead: LeadForGhl,
  stageId: string,
): GhlUpdateOpportunityPayload {
  return {
    pipelineStageId: stageId,
    status: pipelineStageToGhlStatus(lead.pipelineStage),
    name: lead.name,
  };
}
