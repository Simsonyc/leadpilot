import type { ScoreKey } from "./weights";

export type ScoreResult = Record<ScoreKey | "globalScore", number>;

export type SignalExplanationInput = {
  code: string;
  label: string;
  category: string | null;
  confidence: number | null;
  weightApplied: number;
};

const SCORE_LABELS: Record<keyof ScoreResult, string> = {
  businessPainScore: "douleur business",
  digitalWeaknessScore: "faiblesse digitale",
  growthPotentialScore: "potentiel de croissance",
  automationMaturityScore: "maturité d’automatisation",
  urgencyScore: "urgence commerciale",
  visibilityGapScore: "écart de visibilité",
  fitVerticaleScore: "adéquation verticale",
  globalScore: "score global",
};

export function explainScore(scores: ScoreResult, signals: SignalExplanationInput[]): string {
  if (signals.length === 0) {
    return [
      "Aucun signal faible n’a encore été détecté pour ce lead.",
      "Les scores restent volontairement faibles afin d’éviter une qualification artificielle.",
      `Score global actuel : ${scores.globalScore}/100.`,
    ].join("\n");
  }

  const strongestSignals = [...signals]
    .sort((a, b) => b.weightApplied - a.weightApplied)
    .slice(0, 5)
    .map((signal) => {
      const confidence = signal.confidence === null ? "confiance non calculée" : `confiance ${signal.confidence}/100`;
      return `- ${signal.label} (${signal.category ?? "manual"}, poids ${signal.weightApplied}, ${confidence})`;
    });

  const scoreLines = Object.entries(scores)
    .map(([key, value]) => `- ${SCORE_LABELS[key as keyof ScoreResult]} : ${value}/100`)
    .join("\n");

  return [
    "Score calculé à partir des signaux faibles détectés sur le lead.",
    "",
    "Signaux les plus influents :",
    ...strongestSignals,
    "",
    "Synthèse des scores :",
    scoreLines,
    "",
    `Lecture commerciale : ce lead présente un niveau d’opportunité global de ${scores.globalScore}/100.`,
  ].join("\n");
}