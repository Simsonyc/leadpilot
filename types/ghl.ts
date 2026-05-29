// ── Contacts ───────────────────────────────────────────────────

export type GhlContact = {
  id: string;
  locationId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  tags: string[];
  customFields: GhlCustomField[];
  source: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GhlCustomField = {
  id: string;
  value: string | null;
};

export type GhlCreateContactPayload = {
  locationId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  source?: string;
  customFields?: GhlCustomField[];
};

export type GhlUpdateContactPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  customFields?: GhlCustomField[];
};

// ── Opportunities ──────────────────────────────────────────────

export type GhlOpportunity = {
  id: string;
  name: string;
  pipelineId: string;
  pipelineStageId: string;
  status: string;
  monetaryValue: number | null;
  contactId: string;
  createdAt: string;
  updatedAt: string;
};

export type GhlCreateOpportunityPayload = {
  pipelineId: string;
  locationId: string;
  name: string;
  pipelineStageId: string;
  status: "open" | "won" | "lost" | "abandoned";
  contactId: string;
  monetaryValue?: number;
};

export type GhlUpdateOpportunityPayload = {
  pipelineStageId?: string;
  status?: "open" | "won" | "lost" | "abandoned";
  monetaryValue?: number;
  name?: string;
};

// ── Notes ─────────────────────────────────────────────────────

export type GhlCreateNotePayload = {
  body: string;
  userId?: string;
};

// ── Pipelines ─────────────────────────────────────────────────

export type GhlPipeline = {
  id: string;
  name: string;
  stages: GhlPipelineStage[];
};

export type GhlPipelineStage = {
  id: string;
  name: string;
  position: number;
};

// ── Réponses API ───────────────────────────────────────────────

export type GhlApiResponse<T> = {
  data?: T;
  contact?: T;
  opportunity?: T;
  contacts?: T;
  opportunities?: T;
  pipelines?: T;
};

// ── Résultat sync ──────────────────────────────────────────────

export type GhlSyncResult = {
  success: boolean;
  contactId: string | null;
  opportunityId: string | null;
  action: "created" | "updated" | "skipped";
  error?: string;
};
