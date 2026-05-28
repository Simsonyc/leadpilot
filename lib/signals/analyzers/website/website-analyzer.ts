import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";
import { loadDom } from "../../utils/load-dom";

function textContainsAny(text: string, patterns: string[]): boolean {
  const normalizedText = text.toLowerCase();

  return patterns.some((pattern) => normalizedText.includes(pattern.toLowerCase()));
}

export const analyzeWebsite: SignalAnalyzer = {
  name: "website-analyzer",
  enabled: true,
  analyze: ({ websiteSnapshot }) => {
    if (!websiteSnapshot || !websiteSnapshot.ok) {
      return [
        createSignal({
          code: "WEBSITE_NOT_FOUND",
          category: "website",
          label: "Site web inaccessible",
          description: "Le site web du lead est absent ou inaccessible.",
          detected: true,
          confidence: 90,
          evidence: websiteSnapshot?.requestedUrl ?? "Aucun site web renseigné",
          weight: 10,
        }),
      ];
    }

    const html = websiteSnapshot.html;
    const $ = loadDom(html);
    const bodyText = $("body").text();

    const hasCta = textContainsAny(bodyText, [
      "contactez-nous",
      "demander un devis",
      "prendre rendez-vous",
      "réserver",
      "reservation",
      "nous contacter",
      "call now",
      "book now",
      "get started",
    ]);

    const hasForm = $("form").length > 0 || $('input[type="email"], input[name*="email" i]').length > 0;

    const hasTracking =
      /googletagmanager\.com/i.test(html) ||
      /google-analytics\.com/i.test(html) ||
      /gtag\(/i.test(html) ||
      /fbq\(/i.test(html) ||
      /hotjar/i.test(html) ||
      /matomo/i.test(html) ||
      /plausible/i.test(html) ||
      /clarity\.ms/i.test(html);

    return [
      createSignal({
        code: "WEBSITE_NO_CLEAR_CTA",
        category: "conversion",
        label: "Absence de CTA clair",
        description: "Aucun appel à l’action clair n’a été détecté.",
        detected: !hasCta,
        confidence: 75,
        evidence: hasCta ? "CTA détecté" : "Aucun CTA évident détecté",
        value: String(hasCta),
        weight: 7,
      }),
      createSignal({
        code: "WEBSITE_NO_FORM_DETECTED",
        category: "conversion",
        label: "Aucun formulaire détecté",
        description: "Aucun formulaire de contact ou de capture n’a été détecté.",
        detected: !hasForm,
        confidence: 75,
        evidence: hasForm ? "Formulaire détecté" : "Aucun formulaire détecté",
        value: String(hasForm),
        weight: 5,
      }),
      createSignal({
        code: "WEBSITE_NO_TRACKING_DETECTED",
        category: "automation",
        label: "Aucun tracking détecté",
        description: "Aucun outil de tracking marketing évident n’a été détecté.",
        detected: !hasTracking,
        confidence: 70,
        evidence: hasTracking ? "Tracking détecté" : "Aucun tracking détecté",
        value: String(hasTracking),
        weight: 5,
      }),
    ];
  },
};