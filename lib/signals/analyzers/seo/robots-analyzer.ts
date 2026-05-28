import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";
import { getOrigin } from "../../utils/url-utils";

export const analyzeRobots: SignalAnalyzer = {
  name: "robots-analyzer",
  enabled: true,
  analyze: async ({ websiteSnapshot }) => {
    const origin = websiteSnapshot ? getOrigin(websiteSnapshot.finalUrl) : null;

    if (!origin) {
      return [
        createSignal({
          code: "SEO_NO_ROBOTS",
          category: "seo",
          label: "Robots.txt non vérifiable",
          description: "Le fichier robots.txt ne peut pas être vérifié sans URL valide.",
          detected: false,
          status: "unknown",
          confidence: 40,
          evidence: "URL invalide ou site inaccessible",
          weight: 4,
        }),
      ];
    }

    try {
      const response = await fetch(`${origin}/robots.txt`, { method: "GET" });

      return [
        createSignal({
          code: "SEO_NO_ROBOTS",
          category: "seo",
          label: "Robots.txt absent",
          description: "Aucun robots.txt accessible n’a été détecté.",
          detected: !response.ok,
          confidence: 75,
          evidence: `${origin}/robots.txt status ${response.status}`,
          value: String(response.status),
          weight: 4,
        }),
      ];
    } catch {
      return [
        createSignal({
          code: "SEO_NO_ROBOTS",
          category: "seo",
          label: "Robots.txt non vérifiable",
          description: "La vérification du robots.txt a échoué.",
          detected: false,
          status: "unknown",
          confidence: 40,
          evidence: "Erreur de vérification robots.txt",
          weight: 4,
        }),
      ];
    }
  },
};