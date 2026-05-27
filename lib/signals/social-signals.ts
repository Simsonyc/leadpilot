import type { NormalizedWeakSignal, WebsiteSnapshot } from "./types";

const SOCIAL_PATTERNS: RegExp[] = [
  /linkedin\.com/i,
  /facebook\.com/i,
  /instagram\.com/i,
  /twitter\.com/i,
  /x\.com/i,
  /tiktok\.com/i,
  /youtube\.com/i,
];

export function detectSocialSignals(snapshot: WebsiteSnapshot): NormalizedWeakSignal[] {
  const hasSocialLinks = SOCIAL_PATTERNS.some((pattern) => pattern.test(snapshot.html));

  if (hasSocialLinks) {
    return [];
  }

  return [
    {
      code: "WEBSITE_NO_SOCIAL_LINKS",
      label: "Aucun réseau social détecté",
      description: "Le site ne présente aucun lien évident vers des réseaux sociaux.",
      category: "social",
      defaultWeight: 4,
      confidence: 75,
      evidence: "Aucun lien social détecté dans le HTML",
      value: "false",
      weightApplied: 4,
      severity: "medium",
    },
  ];
}