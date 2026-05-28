import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";

export const analyzeInstagram: SignalAnalyzer = {
  name: "instagram-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot, channels }) => {
    const found = /instagram\.com/i.test(websiteSnapshot?.html ?? "") || Boolean(channels.instagram);

    return [
      createSignal({
        code: "INSTAGRAM_NOT_FOUND",
        category: "social",
        label: "Instagram absent",
        description: "Aucun lien Instagram n’a été détecté.",
        detected: Boolean(websiteSnapshot && !found),
        confidence: 70,
        evidence: found ? channels.instagram ?? "Lien Instagram détecté" : "Instagram absent",
        value: String(found),
        weight: 4,
        sourceChannel: "instagram",
      }),
    ];
  },
};