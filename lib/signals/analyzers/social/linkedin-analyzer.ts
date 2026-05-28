import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";

export const analyzeLinkedin: SignalAnalyzer = {
  name: "linkedin-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot, channels }) => {
    const found = /linkedin\.com/i.test(websiteSnapshot?.html ?? "") || Boolean(channels.linkedin);

    return [
      createSignal({
        code: "LINKEDIN_NOT_FOUND",
        category: "social",
        label: "LinkedIn absent",
        description: "Aucun lien LinkedIn n’a été détecté.",
        detected: Boolean(websiteSnapshot && !found),
        confidence: 70,
        evidence: found ? channels.linkedin ?? "Lien LinkedIn détecté" : "LinkedIn absent",
        value: String(found),
        weight: 4,
        sourceChannel: "linkedin",
      }),
    ];
  },
};