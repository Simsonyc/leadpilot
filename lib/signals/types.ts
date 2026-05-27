export type SignalCategory = "website" | "seo" | "social" | "conversion" | "tracking";

export type SignalSeverity = "info" | "low" | "medium" | "high";

export type NormalizedWeakSignal = {
  code: string;
  label: string;
  description: string;
  category: SignalCategory;
  defaultWeight: number;
  confidence: number | null;
  evidence: string | null;
  value: string | null;
  weightApplied: number;
  severity: SignalSeverity;
};

export type WebsiteAnalysisInput = {
  leadId: string;
  website: string;
};

export type WebsiteSnapshot = {
  requestedUrl: string;
  finalUrl: string;
  html: string;
  status: number;
  isHttps: boolean;
};