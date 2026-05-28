import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";
import { loadDom } from "../../utils/load-dom";

export const analyzeSchema: SignalAnalyzer = {
  name: "schema-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot }) => {
    const html = websiteSnapshot?.html ?? "";
    const $ = loadDom(html);

    const hasJsonLd = $('script[type="application/ld+json"]').length > 0;
    const hasMicrodata = $("[itemscope], [itemtype], [itemprop]").length > 0;
    const hasSchema = hasJsonLd || hasMicrodata;

    return [
      createSignal({
        code: "SEO_NO_SCHEMA_ORG",
        category: "seo",
        label: "Schema.org absent",
        description: "Aucune donnée structurée Schema.org n’a été détectée.",
        detected: Boolean(websiteSnapshot && !hasSchema),
        confidence: 80,
        evidence: hasSchema ? "Schema.org détecté" : "Schema.org absent",
        value: String(hasSchema),
        weight: 4,
      }),
    ];
  },
};