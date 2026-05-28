import { DEFAULT_CONFIDENCE, SIGNAL_WEIGHTS } from "./constants";
import type { NormalizedSignal, SignalCategory, SignalStatus } from "./types";

type CreateSignalInput = {
  code: string;
  category: SignalCategory;
  label: string;
  description: string;
  detected: boolean;
  status?: SignalStatus;
  confidence?: number;
  evidence?: string;
  value?: string;
  weight?: number;
  sourceChannel?: string;
  metadata?: Record<string, unknown>;
};

export function createSignal(input: CreateSignalInput): NormalizedSignal {
  return {
    code: input.code,
    category: input.category,
    label: input.label,
    description: input.description,
    detected: input.detected,
    status: input.status ?? (input.detected ? "detected" : "not_detected"),
    confidence: input.confidence ?? DEFAULT_CONFIDENCE,
    evidence: input.evidence,
    value: input.value,
    weight: input.weight ?? SIGNAL_WEIGHTS[input.code] ?? 1,
    sourceChannel: input.sourceChannel,
    metadata: input.metadata,
  };
}

export function dedupeSignals(signals: NormalizedSignal[]): NormalizedSignal[] {
  const map = new Map<string, NormalizedSignal>();

  for (const signal of signals) {
    const existing = map.get(signal.code);

    if (!existing || signal.detected) {
      map.set(signal.code, signal);
    }
  }

  return Array.from(map.values());
}