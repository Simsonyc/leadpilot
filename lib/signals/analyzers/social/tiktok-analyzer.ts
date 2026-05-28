import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";

export const analyzeTiktok: SignalAnalyzer = {
  name: "tiktok-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot, channels }) => {
    const found = /tiktok\.com/i.test(websiteSnapshot?.html ?? "") || Boolean(channels.tiktok);

    return [
      createSignal({
        code: "TIKTOK_NOT_FOUND",
        category: "social",
        label: "TikTok absent",
        description: "Aucun lien TikTok n’a été détecté.",
        detected: Boolean(websiteSnapshot && !found),
        confidence: 65,
        evidence: found ? channels.tiktok ?? "Lien TikTok détecté" : "TikTok absent",
        value: String(found),
        weight: 3,
        sourceChannel: "tiktok",
      }),
    ];
  },
};