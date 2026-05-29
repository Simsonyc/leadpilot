export type LeadTimelineEventUi = {
  id: string;
  leadId?: string;
  type?: string | null;
  label?: string | null;
  payload?: unknown;
  createdAt?: string | Date | null;
};

export type LeadNextActionUi = {
  id: string;
  leadId?: string;
  label?: string | null;
  dueAt?: string | Date | null;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | null;
  completed?: boolean | null;
  createdAt?: string | Date | null;
  completedAt?: string | Date | null;
};

export type LeadUi = {
  id: string;
  name?: string | null;
  contactName?: string | null;
  sector?: string | null;
  verticale?: string | null;
  vertical?: string | null;
  city?: string | null;
  sourceChannel?: string | null;
  status?: string | null;
  pipelineStage?:
    | "TO_CONTACT"
    | "QUALIFICATION"
    | "MEETING"
    | "PROPOSAL"
    | "FOLLOW_UP"
    | "CLOSING"
    | "LOST"
    | null;
  temperature?: string | null;
  score?: number | null;
  globalScore?: number | null;
  confidenceScore?: number | null;
  tags?: string[] | null;
  notes?: string | null;
  nextActionAt?: string | Date | null;
  statusReason?: string | null;
  isArchived?: boolean | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  weakSignals?: unknown[];
  aiOutputs?: unknown[];
  events?: unknown[];
  scores?: unknown[];
  actions?: unknown[];
  timelineEvents?: LeadTimelineEventUi[];
  nextActions?: LeadNextActionUi[];
};