export type SignalStatus = "detected" | "not_detected" | "unknown";

export type SignalCategory =
  | "website"
  | "seo"
  | "social"
  | "community"
  | "directories"
  | "reputation"
  | "conversion"
  | "automation";

export type LeadChannelMap = Record<string, string | null | undefined>;

export type WebsiteSnapshot = {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  ok: boolean;
  html: string;
  responseTimeMs: number;
  isHttps: boolean;
};

export type NormalizedSignal = {
  code: string;
  category: SignalCategory;
  label: string;
  description: string;
  detected: boolean;
  status: SignalStatus;
  confidence: number;
  evidence?: string;
  value?: string;
  weight: number;
  sourceChannel?: string;
  metadata?: Record<string, unknown>;
};

export type LeadSignalInput = {
  id: string;
  website: string | null;
  sourceChannel: string | null;
  channels: unknown;
  rawPayload: unknown;
  metadata: unknown;
};

export type SignalAnalyzerContext = {
  lead: LeadSignalInput;
  websiteSnapshot: WebsiteSnapshot | null;
  channels: LeadChannelMap;
};

export type SignalAnalyzer = {
  name: string;
  enabled: boolean;
  analyze: (context: SignalAnalyzerContext) => Promise<NormalizedSignal[]> | NormalizedSignal[];
};

export type SignalEngineResult = {
  detectedCount: number;
  persistedCount: number;
  channelsAnalyzed: string[];
  signals: NormalizedSignal[];
};