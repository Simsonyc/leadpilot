import { prisma } from "@/lib/prisma";
import { detectSeoSignals } from "./seo-signals";
import { detectSocialSignals } from "./social-signals";
import type { NormalizedWeakSignal, WebsiteAnalysisInput, WebsiteSnapshot } from "./types";
import { detectWebsiteSignals } from "./website-signals";

function normalizeWebsiteUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    throw new Error("Website URL is empty.");
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

async function fetchWebsiteSnapshot(website: string): Promise<WebsiteSnapshot> {
  const requestedUrl = normalizeWebsiteUrl(website);

  const response = await fetch(requestedUrl, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent": "LeadPilotBot/1.0 (+https://leadpilot.local)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  const html = await response.text();
  const finalUrl = response.url || requestedUrl;

  return {
    requestedUrl,
    finalUrl,
    html,
    status: response.status,
    isHttps: finalUrl.startsWith("https://"),
  };
}

function dedupeSignals(signals: NormalizedWeakSignal[]): NormalizedWeakSignal[] {
  const map = new Map<string, NormalizedWeakSignal>();

  for (const signal of signals) {
    map.set(signal.code, signal);
  }

  return Array.from(map.values());
}

async function persistSignals(leadId: string, signals: NormalizedWeakSignal[]) {
  const persistedSignals = [];

  for (const signal of signals) {
    const weakSignal = await prisma.weakSignal.upsert({
      where: {
        code: signal.code,
      },
      update: {
        label: signal.label,
        description: signal.description,
        category: signal.category,
        defaultWeight: signal.defaultWeight,
      },
      create: {
        code: signal.code,
        label: signal.label,
        description: signal.description,
        category: signal.category,
        defaultWeight: signal.defaultWeight,
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
        evidence: signal.evidence,
        value: signal.value,
        weightApplied: signal.weightApplied,
      },
      create: {
        leadId,
        weakSignalId: weakSignal.id,
        confidence: signal.confidence,
        evidence: signal.evidence,
        value: signal.value,
        weightApplied: signal.weightApplied,
      },
      include: {
        weakSignal: true,
      },
    });

    persistedSignals.push(leadWeakSignal);
  }

  return persistedSignals;
}

export async function analyzeLeadWebsiteSignals(input: WebsiteAnalysisInput) {
  const snapshot = await fetchWebsiteSnapshot(input.website);

  const detectedSignals = dedupeSignals([
    ...detectWebsiteSignals(snapshot),
    ...detectSeoSignals(snapshot),
    ...detectSocialSignals(snapshot),
  ]);

  const persistedSignals = await persistSignals(input.leadId, detectedSignals);

  await prisma.lead.update({
    where: {
      id: input.leadId,
    },
    data: {
      lastActivityAt: new Date(),
    },
  });

  return {
    snapshot: {
      requestedUrl: snapshot.requestedUrl,
      finalUrl: snapshot.finalUrl,
      status: snapshot.status,
      isHttps: snapshot.isHttps,
    },
    detectedCount: detectedSignals.length,
    persistedCount: persistedSignals.length,
    signals: persistedSignals,
  };
}