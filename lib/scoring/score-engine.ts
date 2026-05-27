import { prisma } from "@/lib/prisma";
import { explainScore, type SignalExplanationInput, type ScoreResult } from "./score-explainer";
import {
  clampScore,
  getCategoryWeights,
  getCodeWeights,
  type ScoreKey,
} from "./weights";

type LeadSignalForScoring = {
  confidence: number | null;
  weightApplied: number;
  effectiveWeight: number;
  weakSignal: {
    id: string;
    code: string;
    label: string;
    category: string | null;
    defaultWeight: number;
  };
};

const SCORE_KEYS: ScoreKey[] = [
  "businessPainScore",
  "digitalWeaknessScore",
  "growthPotentialScore",
  "automationMaturityScore",
  "urgencyScore",
  "visibilityGapScore",
  "fitVerticaleScore",
];

function createEmptyScoreAccumulator(): Record<ScoreKey, number> {
  return {
    businessPainScore: 0,
    digitalWeaknessScore: 0,
    growthPotentialScore: 0,
    automationMaturityScore: 0,
    urgencyScore: 0,
    visibilityGapScore: 0,
    fitVerticaleScore: 0,
  };
}

function confidenceFactor(confidence: number | null): number {
  if (confidence === null) {
    return 0.65;
  }

  return Math.max(0.2, Math.min(1, confidence / 100));
}

function computeSignalImpact(signal: LeadSignalForScoring): number {
  return signal.effectiveWeight * confidenceFactor(signal.confidence);
}

function computeScoresFromSignals(signals: LeadSignalForScoring[]): ScoreResult {
  const accumulator = createEmptyScoreAccumulator();

  if (signals.length === 0) {
    return {
      businessPainScore: 5,
      digitalWeaknessScore: 5,
      growthPotentialScore: 5,
      automationMaturityScore: 5,
      urgencyScore: 5,
      visibilityGapScore: 5,
      fitVerticaleScore: 10,
      globalScore: 6,
    };
  }

  for (const signal of signals) {
    const categoryWeights = getCategoryWeights(signal.weakSignal.category);
    const codeWeights = getCodeWeights(signal.weakSignal.code);
    const baseImpact = computeSignalImpact(signal);

    for (const key of SCORE_KEYS) {
      const categoryMultiplier = categoryWeights[key] ?? 0;
      const codeMultiplier = codeWeights[key] ?? 0;
      const totalMultiplier = categoryMultiplier + codeMultiplier;

      if (totalMultiplier > 0) {
        accumulator[key] += baseImpact * totalMultiplier * 6;
      }
    }
  }

  const businessPainScore = clampScore(accumulator.businessPainScore);
  const digitalWeaknessScore = clampScore(accumulator.digitalWeaknessScore);
  const growthPotentialScore = clampScore(accumulator.growthPotentialScore);
  const automationMaturityScore = clampScore(accumulator.automationMaturityScore);
  const urgencyScore = clampScore(accumulator.urgencyScore);
  const visibilityGapScore = clampScore(accumulator.visibilityGapScore);
  const fitVerticaleScore = clampScore(
    20 + accumulator.fitVerticaleScore + Math.min(25, signals.length * 3),
  );

  const globalScore = clampScore(
    businessPainScore * 0.18 +
      digitalWeaknessScore * 0.16 +
      growthPotentialScore * 0.18 +
      automationMaturityScore * 0.12 +
      urgencyScore * 0.14 +
      visibilityGapScore * 0.14 +
      fitVerticaleScore * 0.08,
  );

  return {
    businessPainScore,
    digitalWeaknessScore,
    growthPotentialScore,
    automationMaturityScore,
    urgencyScore,
    visibilityGapScore,
    fitVerticaleScore,
    globalScore,
  };
}

function buildExplanationSignals(signals: LeadSignalForScoring[]): SignalExplanationInput[] {
  return signals.map((signal) => ({
    code: signal.weakSignal.code,
    label: signal.weakSignal.label,
    category: signal.weakSignal.category,
    confidence: signal.confidence,
    weightApplied: signal.effectiveWeight,
  }));
}

function resolveEffectiveSignalWeights(
  signals: Array<Omit<LeadSignalForScoring, "effectiveWeight">>,
  verticalWeights: Array<{
    weakSignalId: string;
    weight: number;
    isActive: boolean;
  }>,
): LeadSignalForScoring[] {
  const activeVerticalWeights = new Map<string, number>();

  for (const verticalWeight of verticalWeights) {
    if (verticalWeight.isActive) {
      activeVerticalWeights.set(verticalWeight.weakSignalId, verticalWeight.weight);
    }
  }

  return signals.map((signal) => {
    const verticalWeight = activeVerticalWeights.get(signal.weakSignal.id);

    return {
      ...signal,
      effectiveWeight:
        verticalWeight ??
        signal.weightApplied ??
        signal.weakSignal.defaultWeight,
    };
  });
}

export async function scoreLead(leadId: string) {
  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      deletedAt: null,
    },
    include: {
      weakSignals: {
        include: {
          weakSignal: true,
        },
      },
    },
  });

  if (!lead) {
    return null;
  }

  const verticalWeights = lead.verticaleId
    ? await prisma.verticalSignalWeight.findMany({
        where: {
          verticaleId: lead.verticaleId,
          isActive: true,
        },
        select: {
          weakSignalId: true,
          weight: true,
          isActive: true,
        },
      })
    : [];

  const weightedSignals = resolveEffectiveSignalWeights(
    lead.weakSignals,
    verticalWeights,
  );

  const scores = computeScoresFromSignals(weightedSignals);
  const explanation = explainScore(scores, buildExplanationSignals(weightedSignals));
  const now = new Date();

  const createdScore = await prisma.leadScore.create({
    data: {
      leadId: lead.id,
      businessPainScore: scores.businessPainScore,
      digitalWeaknessScore: scores.digitalWeaknessScore,
      growthPotentialScore: scores.growthPotentialScore,
      automationMaturityScore: scores.automationMaturityScore,
      urgencyScore: scores.urgencyScore,
      visibilityGapScore: scores.visibilityGapScore,
      fitVerticaleScore: scores.fitVerticaleScore,
      globalScore: scores.globalScore,
      explanation,
    },
  });

  await prisma.lead.update({
    where: {
      id: lead.id,
    },
    data: {
      globalScore: scores.globalScore,
      lastActivityAt: now,
    },
  });

  return {
    leadId: lead.id,
    scores: {
      businessPainScore: createdScore.businessPainScore,
      digitalWeaknessScore: createdScore.digitalWeaknessScore,
      growthPotentialScore: createdScore.growthPotentialScore,
      automationMaturityScore: createdScore.automationMaturityScore,
      urgencyScore: createdScore.urgencyScore,
      visibilityGapScore: createdScore.visibilityGapScore,
      fitVerticaleScore: createdScore.fitVerticaleScore,
      globalScore: createdScore.globalScore,
    },
    explanation: createdScore.explanation,
  };
}