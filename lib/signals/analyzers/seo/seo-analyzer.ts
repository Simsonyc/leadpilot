import type { SignalAnalyzer } from "../../core/types";
import { createSignal } from "../../core/normalizer";
import { loadDom } from "../../utils/load-dom";
import { analyzeTitle } from "./title-analyzer";
import { analyzeH1 } from "./h1-analyzer";
import { analyzeOpenGraph } from "./opengraph-analyzer";
import { analyzeSitemap } from "./sitemap-analyzer";
import { analyzeRobots } from "./robots-analyzer";
import { analyzeSchema } from "./schema-analyzer";

export const analyzeSeo: SignalAnalyzer = {
  name: "seo-analyzer",
  enabled: true,

  analyze: async (context) => {
    const html = context.websiteSnapshot?.html ?? "";
    const $ = loadDom(html);

    const metaDescription = $('meta[name="description"]').attr("content")?.trim() ?? "";

    const titleSignals = await analyzeTitle.analyze(context);
    const h1Signals = await analyzeH1.analyze(context);
    const openGraphSignals = await analyzeOpenGraph.analyze(context);
    const sitemapSignals = await analyzeSitemap.analyze(context);
    const robotsSignals = await analyzeRobots.analyze(context);
    const schemaSignals = await analyzeSchema.analyze(context);

    return [
      ...titleSignals,
      ...h1Signals,
      ...openGraphSignals,
      ...sitemapSignals,
      ...robotsSignals,
      ...schemaSignals,
      createSignal({
        code: "SEO_NO_META_DESCRIPTION",
        category: "seo",
        label: "Meta description absente",
        description: "Aucune meta description n’a été détectée.",
        detected: Boolean(context.websiteSnapshot && !metaDescription),
        confidence: 90,
        evidence: metaDescription || "Meta description absente",
        value: metaDescription,
        weight: 6,
      }),
      createSignal({
        code: "SEO_WEAK_META_DESCRIPTION",
        category: "seo",
        label: "Meta description faible",
        description: "La meta description détectée semble trop courte.",
        detected: Boolean(metaDescription && metaDescription.length < 50),
        confidence: 80,
        evidence: metaDescription || "Non applicable",
        value: metaDescription,
        weight: 4,
      }),
    ];
  },
};