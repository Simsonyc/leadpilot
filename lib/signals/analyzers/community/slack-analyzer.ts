import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";

export const analyzeSlack: SignalAnalyzer = {
  name: "slack-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot, channels }) => {
    const found = /slack\.com/i.test(websiteSnapshot?.html ?? "") || Boolean(channels.slack);

    return [
      createSignal({
        code: "SLACK_NOT_FOUND",
        category: "community",
        label: "Slack absent",
        description: "Aucun lien Slack n’a été détecté.",
        detected: Boolean(websiteSnapshot && !found),
        confidence: 60,
        evidence: found ? channels.slack ?? "Slack détecté" : "Slack absent",
        value: String(found),
        weight: 2,
      }),
    ];
  },
};