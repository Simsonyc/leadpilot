import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";

export const analyzeYoutube: SignalAnalyzer = {
  name: "youtube-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot, channels }) => {
    const found =
      /youtube\.com|youtu\.be/i.test(websiteSnapshot?.html ?? "") ||
      Boolean(channels.youtube);

    return [
      createSignal({
        code: "YOUTUBE_NOT_FOUND",
        category: "social",
        label: "YouTube absent",
        description: "Aucun lien YouTube n’a été détecté.",
        detected: Boolean(websiteSnapshot && !found),
        confidence: 65,
        evidence: found ? channels.youtube ?? "Lien YouTube détecté" : "YouTube absent",
        value: String(found),
        weight: 3,
        sourceChannel: "youtube",
      }),
    ];
  },
};