import type { ExtractedContent } from "./content-extractor";
import type { SocialAnalysis } from "./social-fetcher";

export type ConfidenceResult = {
  score: number;
  level: "high" | "medium" | "low";
  details: string;
  breakdown: Record<string, number>;
};

export function calculateConfidence(params: {
  siteReachable: boolean;
  contentExtracted: ExtractedContent | null;
  socialAnalyses: SocialAnalysis[];
  signalsCount: number;
  hasGooglePlaces: boolean;
}): ConfidenceResult {
  const breakdown: Record<string, number> = {};
  let score = 0;

  // Site accessible (+30)
  if (params.siteReachable) {
    breakdown["Site accessible"] = 30;
    score += 30;
  } else {
    breakdown["Site inaccessible"] = 0;
  }

  // Contenu extrait (+20)
  if (params.contentExtracted && params.contentExtracted.wordCount > 100) {
    breakdown["Contenu textuel extrait"] = 20;
    score += 20;
  } else if (params.contentExtracted && params.contentExtracted.wordCount > 0) {
    breakdown["Contenu textuel partiel"] = 10;
    score += 10;
  }

  // Signaux techniques détectés (+15)
  if (params.signalsCount >= 5) {
    breakdown["Signaux techniques complets"] = 15;
    score += 15;
  } else if (params.signalsCount > 0) {
    breakdown["Signaux techniques partiels"] = 8;
    score += 8;
  }

  // Réseaux sociaux accessibles (+20)
  const accessibleSocials = params.socialAnalyses.filter((s) => s.accessible).length;
  const totalSocials = params.socialAnalyses.length;

  if (totalSocials === 0) {
    breakdown["Aucun réseau social détecté"] = 0;
  } else if (accessibleSocials === 0) {
    breakdown["Réseaux sociaux bloqués"] = 5;
    score += 5;
  } else if (accessibleSocials >= 2) {
    breakdown["Réseaux sociaux accessibles"] = 20;
    score += 20;
  } else {
    breakdown["1 réseau social accessible"] = 12;
    score += 12;
  }

  // Métadonnées SEO disponibles (+10)
  if (params.contentExtracted) {
    const hasMeta =
      params.contentExtracted.title ||
      params.contentExtracted.metaDescription ||
      params.contentExtracted.h1.length > 0;
    if (hasMeta) {
      breakdown["Métadonnées SEO disponibles"] = 10;
      score += 10;
    }
  }

  // Google Places disponible (+5)
  if (params.hasGooglePlaces) {
    breakdown["Données Google Places"] = 5;
    score += 5;
  }

  const finalScore = Math.min(100, score);
  const level: ConfidenceResult["level"] =
    finalScore >= 70 ? "high" : finalScore >= 40 ? "medium" : "low";

  const detailLines = Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .map(([k]) => k);

  const missingLines = Object.entries(breakdown)
    .filter(([, v]) => v === 0)
    .map(([k]) => k);

  const details = [
    detailLines.length > 0 ? `Disponible : ${detailLines.join(", ")}.` : "",
    missingLines.length > 0 ? `Non disponible : ${missingLines.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return { score: finalScore, level, details, breakdown };
}
