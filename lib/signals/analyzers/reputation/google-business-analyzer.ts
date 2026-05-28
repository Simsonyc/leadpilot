import { createSignal } from "../../core/normalizer";
import type { SignalAnalyzer } from "../../core/types";

function readNumber(metadata: unknown, key: string): number | null {
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
    return null;
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "number" ? value : null;
}

export const analyzeGoogleBusiness: SignalAnalyzer = {
  name: "google-business-analyzer",
  enabled: true,
  analyze: ({ lead }) => {
    const rating = readNumber(lead.metadata, "googleRating");
    const reviews = readNumber(lead.metadata, "googleReviewsCount");

    return [
      createSignal({
        code: "GOOGLE_BUSINESS_NOT_FOUND",
        category: "reputation",
        label: "Google Business non vérifiable",
        description: "La présence Google Business ne peut pas être vérifiée sans API officielle.",
        detected: false,
        status: "unknown",
        confidence: 30,
        evidence: "Non vérifiable sans Google Business Profile API",
        weight: 5,
      }),
      createSignal({
        code: "GOOGLE_RATING_LOW",
        category: "reputation",
        label: "Note Google faible",
        description: "La note Google connue est faible.",
        detected: rating !== null && rating < 4,
        status: rating === null ? "unknown" : undefined,
        confidence: rating === null ? 30 : 80,
        evidence: rating === null ? "Note non disponible" : `Note ${rating}/5`,
        value: rating === null ? undefined : String(rating),
        weight: 7,
      }),
      createSignal({
        code: "GOOGLE_REVIEWS_LOW_VOLUME",
        category: "reputation",
        label: "Volume d’avis Google faible",
        description: "Le volume d’avis Google connu est faible.",
        detected: reviews !== null && reviews < 20,
        status: reviews === null ? "unknown" : undefined,
        confidence: reviews === null ? 30 : 80,
        evidence: reviews === null ? "Volume d’avis non disponible" : `${reviews} avis`,
        value: reviews === null ? undefined : String(reviews),
        weight: 5,
      }),
      createSignal({
        code: "GOOGLE_REVIEWS_OLD",
        category: "reputation",
        label: "Récence des avis non vérifiable",
        description: "La récence des avis nécessite une API officielle.",
        detected: false,
        status: "unknown",
        confidence: 30,
        evidence: "Non vérifiable sans API officielle",
        weight: 4,
      }),
      createSignal({
        code: "GOOGLE_REVIEWS_UNANSWERED",
        category: "reputation",
        label: "Réponses aux avis non vérifiables",
        description: "Les réponses aux avis nécessitent une API officielle.",
        detected: false,
        status: "unknown",
        confidence: 30,
        evidence: "Non vérifiable sans API officielle",
        weight: 4,
      }),
    ];
  },
};