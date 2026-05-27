import type { NormalizedWeakSignal, WebsiteSnapshot } from "./types";

function countMatches(html: string, regex: RegExp): number {
  return Array.from(html.matchAll(regex)).length;
}

export function detectSeoSignals(snapshot: WebsiteSnapshot): NormalizedWeakSignal[] {
  const html = snapshot.html;
  const h1Count = countMatches(html, /<h1[\s>]/gi);
  const canonicalDetected = /rel=["']canonical["']/i.test(html);
  const robotsNoIndex = /noindex/i.test(html);

  const signals: NormalizedWeakSignal[] = [];

  if (h1Count === 0) {
    signals.push({
      code: "SEO_NO_H1",
      label: "Aucun H1 détecté",
      description: "La page ne contient pas de balise H1 détectable.",
      category: "seo",
      defaultWeight: 5,
      confidence: 85,
      evidence: "0 balise H1 détectée",
      value: "0",
      weightApplied: 5,
      severity: "medium",
    });
  }

  if (h1Count > 1) {
    signals.push({
      code: "SEO_MULTIPLE_H1",
      label: "Plusieurs H1 détectés",
      description: "La page contient plusieurs balises H1, ce qui peut nuire à la clarté SEO.",
      category: "seo",
      defaultWeight: 3,
      confidence: 80,
      evidence: `${h1Count} balises H1 détectées`,
      value: String(h1Count),
      weightApplied: 3,
      severity: "low",
    });
  }

  if (!canonicalDetected) {
    signals.push({
      code: "SEO_NO_CANONICAL",
      label: "Canonical absente",
      description: "Aucune balise canonical n’a été détectée.",
      category: "seo",
      defaultWeight: 3,
      confidence: 70,
      evidence: "Aucune balise canonical détectée",
      value: "false",
      weightApplied: 3,
      severity: "low",
    });
  }

  if (robotsNoIndex) {
    signals.push({
      code: "SEO_NOINDEX_DETECTED",
      label: "Noindex détecté",
      description: "La page semble contenir une directive noindex.",
      category: "seo",
      defaultWeight: 9,
      confidence: 90,
      evidence: "Directive noindex détectée",
      value: "true",
      weightApplied: 9,
      severity: "high",
    });
  }

  return signals;
}