export type SignalCategory =
  | "website"
  | "seo"
  | "social"
  | "reputation"
  | "conversion"
  | "automation"
  | "sales"
  | "manual"
  | string;

export type ScoreKey =
  | "businessPainScore"
  | "digitalWeaknessScore"
  | "growthPotentialScore"
  | "automationMaturityScore"
  | "urgencyScore"
  | "visibilityGapScore"
  | "fitVerticaleScore";

export const CATEGORY_WEIGHTS: Record<string, Partial<Record<ScoreKey, number>>> = {
  website: {
    digitalWeaknessScore: 1.2,
    visibilityGapScore: 1,
    growthPotentialScore: 0.8,
  },
  seo: {
    visibilityGapScore: 1.4,
    digitalWeaknessScore: 1,
    growthPotentialScore: 0.7,
  },
  social: {
    visibilityGapScore: 1,
    digitalWeaknessScore: 0.7,
    growthPotentialScore: 0.6,
  },
  reputation: {
    businessPainScore: 1.2,
    urgencyScore: 1,
    visibilityGapScore: 0.8,
  },
  conversion: {
    businessPainScore: 1.3,
    growthPotentialScore: 1.1,
    digitalWeaknessScore: 0.9,
  },
  automation: {
    automationMaturityScore: 1.5,
    growthPotentialScore: 0.9,
    businessPainScore: 0.7,
  },
  sales: {
    businessPainScore: 1.2,
    urgencyScore: 1.2,
    growthPotentialScore: 0.9,
  },
  manual: {
    businessPainScore: 1,
    urgencyScore: 1,
    fitVerticaleScore: 0.8,
  },
};

export const CODE_WEIGHTS: Record<string, Partial<Record<ScoreKey, number>>> = {
  WEBSITE_NO_HTTPS: {
    digitalWeaknessScore: 1.2,
    visibilityGapScore: 0.8,
  },
  WEBSITE_MISSING_OR_WEAK_TITLE: {
    visibilityGapScore: 1.2,
    digitalWeaknessScore: 0.9,
  },
  WEBSITE_MISSING_OR_WEAK_META_DESCRIPTION: {
    visibilityGapScore: 1.3,
    digitalWeaknessScore: 0.8,
  },
  WEBSITE_NO_CLEAR_CTA: {
    businessPainScore: 1.4,
    growthPotentialScore: 1.1,
  },
  WEBSITE_NO_FORM_DETECTED: {
    businessPainScore: 1.1,
    growthPotentialScore: 0.9,
    automationMaturityScore: 0.7,
  },
  WEBSITE_NO_TRACKING_DETECTED: {
    automationMaturityScore: 1.4,
    digitalWeaknessScore: 1,
  },
  WEBSITE_NO_SOCIAL_LINKS: {
    visibilityGapScore: 1,
    digitalWeaknessScore: 0.8,
  },
  SEO_NO_H1: {
    visibilityGapScore: 1.2,
    digitalWeaknessScore: 0.8,
  },
  SEO_MULTIPLE_H1: {
    visibilityGapScore: 0.7,
  },
  SEO_NO_CANONICAL: {
    visibilityGapScore: 0.7,
  },
  SEO_NOINDEX_DETECTED: {
    visibilityGapScore: 1.8,
    urgencyScore: 1.4,
    businessPainScore: 1,
  },
};

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getCategoryWeights(category: string | null | undefined) {
  if (!category) {
    return CATEGORY_WEIGHTS.manual;
  }

  return CATEGORY_WEIGHTS[category] ?? CATEGORY_WEIGHTS.manual;
}

export function getCodeWeights(code: string) {
  return CODE_WEIGHTS[code] ?? {};
}