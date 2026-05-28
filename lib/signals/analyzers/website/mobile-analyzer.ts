import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";
import { loadDom } from "../../utils/load-dom";

export const analyzeMobile: SignalAnalyzer = {
  name: "mobile-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot }) => {
    const html = websiteSnapshot?.html ?? "";
    const $ = loadDom(html);
    const hasViewport = $('meta[name="viewport"]').length > 0;

    return [
      createSignal({
        code: "WEBSITE_NO_MOBILE_VIEWPORT",
        category: "website",
        label: "Viewport mobile absent",
        description: "La page ne contient pas de balise viewport mobile détectable.",
        detected: Boolean(websiteSnapshot && !hasViewport),
        confidence: 85,
        evidence: hasViewport ? "Viewport détecté" : "Viewport absent",
        value: String(hasViewport),
        weight: 6,
      }),
    ];
  },
};