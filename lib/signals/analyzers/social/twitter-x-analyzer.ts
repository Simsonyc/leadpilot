import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";

export const analyzeTwitterX: SignalAnalyzer = {
  name: "twitter-x-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot, channels }) => {
    const found =
      /twitter\.com|x\.com/i.test(websiteSnapshot?.html ?? "") ||
      Boolean(channels.twitter_x) ||
      Boolean(channels.x);

    return [
      createSignal({
        code: "TWITTER_X_NOT_FOUND",
        category: "social",
        label: "Twitter/X absent",
        description: "Aucun lien Twitter/X n’a été détecté.",
        detected: Boolean(websiteSnapshot && !found),
        confidence: 65,
        evidence: found ? channels.twitter_x ?? channels.x ?? "Lien Twitter/X détecté" : "Twitter/X absent",
        value: String(found),
        weight: 3,
        sourceChannel: "twitter_x",
      }),
    ];
  },
};