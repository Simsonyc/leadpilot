import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";
import { loadDom } from "../../utils/load-dom";

export const analyzeOpenGraph: SignalAnalyzer = {
  name: "opengraph-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot }) => {
    const html = websiteSnapshot?.html ?? "";
    const $ = loadDom(html);
    const hasOpenGraph = $('meta[property^="og:"]').length > 0;

    return [
      createSignal({
        code: "SEO_NO_OPENGRAPH",
        category: "seo",
        label: "OpenGraph absent",
        description: "Aucune balise OpenGraph n’a été détectée.",
        detected: Boolean(websiteSnapshot && !hasOpenGraph),
        confidence: 80,
        evidence: hasOpenGraph ? "OpenGraph détecté" : "OpenGraph absent",
        value: String(hasOpenGraph),
        weight: 4,
      }),
    ];
  },
};