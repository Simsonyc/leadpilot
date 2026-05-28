import type { CommercialApproach } from "./schemas/commercial-approach-schema";

export type AiProviderName = "openai" | "claude";

export type AiProviderResult = {
  provider: AiProviderName;
  modelUsed: string;
  raw: unknown;
  approach: CommercialApproach;
};

export type CommercialLeadContext = {
  lead: {
    id: string;
    name: string;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    source: string | null;
    sourceChannel: string | null;
    sector: string | null;
    city: string | null;
    department: string | null;
    notes: string | null;
    tags: string[];
    status: string;
    statusReason: string | null;
    temperature: string;
    globalScore: number | null;
    confidenceScore: number | null;
  };
  verticale: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  latestScore: {
    businessPainScore: number | null;
    digitalWeaknessScore: number | null;
    growthPotentialScore: number | null;
    automationMaturityScore: number | null;
    urgencyScore: number | null;
    visibilityGapScore: number | null;
    fitVerticaleScore: number | null;
    globalScore: number | null;
    explanation: string | null;
    createdAt: string;
  } | null;
  weakSignals: Array<{
    code: string;
    label: string;
    category: string | null;
    description: string | null;
    confidence: number | null;
    evidence: string | null;
    value: string | null;
    weightApplied: number;
  }>;
};

export type PersistedCommercialApproach = CommercialApproach & {
  persistedOutputId: string;
  provider: AiProviderName;
  modelUsed: string;
  generationDurationMs: number;
};

export type StableAiErrorCode =
  | "AI_PROVIDER_TIMEOUT"
  | "AI_PROVIDER_ERROR"
  | "AI_PROVIDER_RESPONSE_INVALID"
  | "AI_PROVIDER_NOT_CONFIGURED"
  | "AI_GENERATION_FAILED";