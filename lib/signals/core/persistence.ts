import { prisma } from "@/lib/prisma";
import type { NormalizedSignal } from "./types";

export async function persistDetectedSignals(leadId: string, signals: NormalizedSignal[]) {
  const detectedSignals = signals.filter((signal) => signal.detected);
  const persistedSignals = [];

  for (const signal of detectedSignals) {
    const weakSignal = await prisma.weakSignal.upsert({
      where: {
        code: signal.code,
      },
      update: {
        label: signal.label,
        description: signal.description,
        category: signal.category,
        defaultWeight: signal.weight,
      },
      create: {
        code: signal.code,
        label: signal.label,
        description: signal.description,
        category: signal.category,
        defaultWeight: signal.weight,
      },
    });

    const leadWeakSignal = await prisma.leadWeakSignal.upsert({
      where: {
        leadId_weakSignalId: {
          leadId,
          weakSignalId: weakSignal.id,
        },
      },
      update: {
        confidence: signal.confidence,
        evidence: signal.evidence ?? null,
        value: signal.value ?? null,
        weightApplied: signal.weight,
      },
      create: {
        leadId,
        weakSignalId: weakSignal.id,
        confidence: signal.confidence,
        evidence: signal.evidence ?? null,
        value: signal.value ?? null,
        weightApplied: signal.weight,
      },
      include: {
        weakSignal: true,
      },
    });

    persistedSignals.push(leadWeakSignal);
  }

  return persistedSignals;
}