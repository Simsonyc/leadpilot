import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";

export const analyzeSpeed: SignalAnalyzer = {
  name: "speed-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot }) => {
    if (!websiteSnapshot) {
      return [];
    }

    return [
      createSignal({
        code: "WEBSITE_SLOW_RESPONSE",
        category: "website",
        label: "Réponse du site lente",
        description: "Le temps de réponse initial du site semble élevé.",
        detected: websiteSnapshot.responseTimeMs > 2500,
        confidence: 65,
        evidence: `${websiteSnapshot.responseTimeMs} ms`,
        value: String(websiteSnapshot.responseTimeMs),
        weight: 6,
      }),
    ];
  },
};