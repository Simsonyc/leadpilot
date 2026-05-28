import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";

export const analyzeFacebook: SignalAnalyzer = {
  name: "facebook-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot, channels }) => {
    const found = /facebook\.com/i.test(websiteSnapshot?.html ?? "") || Boolean(channels.facebook);

    return [
      createSignal({
        code: "FACEBOOK_NOT_FOUND",
        category: "social",
        label: "Facebook absent",
        description: "Aucun lien Facebook n’a été détecté.",
        detected: Boolean(websiteSnapshot && !found),
        confidence: 70,
        evidence: found ? channels.facebook ?? "Lien Facebook détecté" : "Facebook absent",
        value: String(found),
        weight: 4,
        sourceChannel: "facebook",
      }),
    ];
  },
};