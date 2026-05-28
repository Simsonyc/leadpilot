import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";

export const analyzeLeboncoin: SignalAnalyzer = {
  name: "leboncoin-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot, channels, lead }) => {
    const found = /leboncoin/i.test(`${websiteSnapshot?.html ?? ""} ${lead.sourceChannel ?? ""} ${channels.leboncoin ?? ""}`);

    return [
      createSignal({
        code: "LEBONCOIN_PRESENT",
        category: "directories",
        label: "Présence Leboncoin détectée",
        description: "Une présence Leboncoin a été détectée.",
        detected: found,
        confidence: 70,
        evidence: found ? "Leboncoin détecté" : "Leboncoin non détecté",
        value: String(found),
        weight: 2,
        sourceChannel: "leboncoin",
      }),
    ];
  },
};