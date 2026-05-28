import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";
import { loadDom } from "../../utils/load-dom";

export const analyzeTitle: SignalAnalyzer = {
  name: "title-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot }) => {
    const html = websiteSnapshot?.html ?? "";
    const $ = loadDom(html);
    const title = $("title").text().trim();

    return [
      createSignal({
        code: "SEO_TITLE_MISSING",
        category: "seo",
        label: "Title SEO absent",
        description: "La page ne contient pas de balise title détectable.",
        detected: Boolean(websiteSnapshot && !title),
        confidence: 90,
        evidence: title || "Title absent",
        value: title,
        weight: 7,
      }),
      createSignal({
        code: "SEO_TITLE_TOO_SHORT",
        category: "seo",
        label: "Title SEO trop court",
        description: "Le title SEO semble trop court pour être performant.",
        detected: Boolean(title && title.length < 20),
        confidence: 80,
        evidence: title || "Non applicable",
        value: title,
        weight: 4,
      }),
      createSignal({
        code: "SEO_TITLE_TOO_LONG",
        category: "seo",
        label: "Title SEO trop long",
        description: "Le title SEO semble trop long.",
        detected: Boolean(title && title.length > 70),
        confidence: 80,
        evidence: title || "Non applicable",
        value: title,
        weight: 3,
      }),
    ];
  },
};