import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";

export const analyzeDirectories: SignalAnalyzer = {
  name: "pages-jaunes-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot, channels, lead }) => {
    const source = `${websiteSnapshot?.html ?? ""} ${lead.sourceChannel ?? ""} ${channels.pages_jaunes ?? ""}`;
    const found = /pagesjaunes|pages-jaunes/i.test(source);

    return [
      createSignal({
        code: "PAGES_JAUNES_PRESENT",
        category: "directories",
        label: "Présence Pages Jaunes détectée",
        description: "Une présence ou source Pages Jaunes a été détectée.",
        detected: found,
        confidence: 75,
        evidence: found ? "Pages Jaunes détecté dans les sources disponibles" : "Pages Jaunes non détecté",
        value: String(found),
        weight: 2,
        sourceChannel: "pages_jaunes",
      }),
    ];
  },
};