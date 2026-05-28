import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";
import { getOrigin } from "../../utils/url-utils";

export const analyzeSitemap: SignalAnalyzer = {
  name: "sitemap-analyzer",
  enabled: true,
  analyze: async ({ websiteSnapshot }) => {
    const origin = websiteSnapshot ? getOrigin(websiteSnapshot.finalUrl) : null;

    if (!origin) {
      return [
        createSignal({
          code: "SEO_NO_SITEMAP",
          category: "seo",
          label: "Sitemap non vérifiable",
          description: "Le sitemap ne peut pas être vérifié sans URL valide.",
          detected: false,
          status: "unknown",
          confidence: 40,
          evidence: "URL invalide ou site inaccessible",
          weight: 4,
        }),
      ];
    }

    try {
      const response = await fetch(`${origin}/sitemap.xml`, { method: "GET" });

      return [
        createSignal({
          code: "SEO_NO_SITEMAP",
          category: "seo",
          label: "Sitemap absent",
          description: "Aucun sitemap.xml accessible n’a été détecté.",
          detected: !response.ok,
          confidence: 75,
          evidence: `${origin}/sitemap.xml status ${response.status}`,
          value: String(response.status),
          weight: 4,
        }),
      ];
    } catch {
      return [
        createSignal({
          code: "SEO_NO_SITEMAP",
          category: "seo",
          label: "Sitemap non vérifiable",
          description: "La vérification du sitemap a échoué.",
          detected: false,
          status: "unknown",
          confidence: 40,
          evidence: "Erreur de vérification sitemap",
          weight: 4,
        }),
      ];
    }
  },
};