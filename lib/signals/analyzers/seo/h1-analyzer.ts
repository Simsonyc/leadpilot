import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";
import { loadDom } from "../../utils/load-dom";

export const analyzeH1: SignalAnalyzer = {
  name: "h1-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot }) => {
    const html = websiteSnapshot?.html ?? "";
    const $ = loadDom(html);
    const h1Count = $("h1").length;

    return [
      createSignal({
        code: "SEO_H1_MISSING",
        category: "seo",
        label: "H1 absent",
        description: "Aucune balise H1 n’a été détectée.",
        detected: Boolean(websiteSnapshot && h1Count === 0),
        confidence: 85,
        evidence: `${h1Count} H1 détecté(s)`,
        value: String(h1Count),
        weight: 5,
      }),
      createSignal({
        code: "SEO_MULTIPLE_H1",
        category: "seo",
        label: "Plusieurs H1 détectés",
        description: "Plusieurs balises H1 ont été détectées.",
        detected: h1Count > 1,
        confidence: 80,
        evidence: `${h1Count} H1 détecté(s)`,
        value: String(h1Count),
        weight: 3,
      }),
    ];
  },
};