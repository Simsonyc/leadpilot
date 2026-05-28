import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";

export const analyzeCommunity: SignalAnalyzer = {
  name: "discord-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot, channels }) => {
    const found = /discord\.gg|discord\.com/i.test(websiteSnapshot?.html ?? "") || Boolean(channels.discord);

    return [
      createSignal({
        code: "DISCORD_NOT_FOUND",
        category: "community",
        label: "Discord absent",
        description: "Aucun lien Discord n’a été détecté.",
        detected: Boolean(websiteSnapshot && !found),
        confidence: 60,
        evidence: found ? channels.discord ?? "Discord détecté" : "Discord absent",
        value: String(found),
        weight: 2,
      }),
      createSignal({
        code: "COMMUNITY_NOT_VISIBLE",
        category: "community",
        label: "Communauté non visible",
        description: "Aucun espace communautaire visible n’a été détecté.",
        detected: Boolean(websiteSnapshot && !found && !channels.slack),
        confidence: 55,
        evidence: "Discord/Slack non détectés",
        weight: 2,
      }),
    ];
  },
};