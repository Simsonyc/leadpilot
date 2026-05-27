export type SignalCategory =
  | "website"
  | "seo"
  | "social"
  | "reputation"
  | "conversion"
  | "automation"
  | "sales"
  | "manual"
  | string;

export type WeakSignal = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  category: string | null;
  defaultWeight: number;
  createdAt: Date;
  updatedAt: Date;
};

export type LeadWeakSignal = {
  id: string;
  leadId: string;
  weakSignalId: string;
  confidence: number | null;
  evidence: string | null;
  value: string | null;
  weightApplied: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateWeakSignalPayload = {
  code: string;
  label: string;
  description?: string | null;
  category?: string | null;
  defaultWeight?: number;
};

export type AttachWeakSignalToLeadPayload = {
  leadId: string;
  weakSignalId: string;
  confidence?: number | null;
  evidence?: string | null;
  value?: string | null;
  weightApplied: number;
};