import { prisma } from "@/lib/prisma";
import { fetchWebsite } from "./website-fetcher";
import {
  runAllDetectors,
  extractSocialLinks,
  extractContactInfo,
  type DetectedSignal,
} from "./signal-detectors";
import { scoreLead } from "@/lib/scoring/score-engine";

type AnalyzeInput = {
  leadId: string;
  website: string;
};

type AnalyzeResult = {
  leadId: string;
  websiteReachable: boolean;
  signalsDetected: number;
  signalCodes: string[];
  scores: object | null;
  contactInfo: {
    emails: string[];
    phones: string[];
  };
  socialLinks: object;
};

export async function analyzeLeadWebsiteSignals(
  input: AnalyzeInput,
): Promise<AnalyzeResult> {
  const { leadId, website } = input;

  // 1. Fetch du site
  const site = await fetchWebsite(website);

  // 2. Extraction des infos de contact et réseaux sociaux
  const contactInfo = extractContactInfo(site.html, site.$);
  const socialLinks = extractSocialLinks(site.$, site.url);

  // 3. Détection des signaux faibles
  const detectedSignals: DetectedSignal[] = site.reachable
    ? runAllDetectors(site)
    : [];

  // 4. Récupérer les WeakSignal existants en base pour les codes détectés
  const codes = detectedSignals.map((s) => s.code);

  const weakSignalsInDb = await prisma.weakSignal.findMany({
    where: { code: { in: codes } },
    select: { id: true, code: true, defaultWeight: true },
  });

  const weakSignalMap = new Map(
    weakSignalsInDb.map((ws) => [ws.code, ws]),
  );

  // 5. Supprimer les anciens signaux de ce lead
  await prisma.leadWeakSignal.deleteMany({ where: { leadId } });

  // 6. Créer les nouveaux signaux détectés (uniquement ceux présents en base)
  const now = new Date();

  const signalsToCreate = detectedSignals
    .filter((signal) => weakSignalMap.has(signal.code))
    .map((signal) => {
      const ws = weakSignalMap.get(signal.code)!;
      return {
        leadId,
        weakSignalId: ws.id,
        confidence: signal.confidence,
        evidence: signal.evidence,
        value: signal.value,
        weightApplied: ws.defaultWeight,
      };
    });

  if (signalsToCreate.length > 0) {
    await prisma.leadWeakSignal.createMany({ data: signalsToCreate });
  }

  // 7. Mettre à jour le lead avec les données extraites
  const updateData: Record<string, unknown> = {
    lastActivityAt: now,
  };

  // Enrichir email et téléphone si pas déjà renseignés
  if (contactInfo.emails.length > 0) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId },
      select: { email: true },
    });
    if (!lead?.email) {
      updateData.email = contactInfo.emails[0];
    }
  }

  if (contactInfo.phones.length > 0) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId },
      select: { phone: true },
    });
    if (!lead?.phone) {
      updateData.phone = contactInfo.phones[0];
    }
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: updateData,
  });

  // 8. Créer un événement timeline
  await prisma.leadTimelineEvent.create({
    data: {
      leadId,
      type: "SIGNALS_ANALYZED",
      label: site.reachable
        ? `${detectedSignals.length} signal(s) détecté(s) sur ${website}`
        : `Site inaccessible : ${website}`,
      payload: {
        website,
        reachable: site.reachable,
        statusCode: site.statusCode,
        signalCodes: codes,
        emails: contactInfo.emails,
        phones: contactInfo.phones,
      },
    },
  });

  // 9. Recalculer le score automatiquement
  const scoreResult = await scoreLead(leadId).catch(() => null);

  // 10. Créer événement timeline pour le score
  if (scoreResult) {
    await prisma.leadTimelineEvent.create({
      data: {
        leadId,
        type: "SCORE_UPDATED",
        label: `Score recalculé : ${scoreResult.scores.globalScore}/100`,
        payload: { scores: scoreResult.scores },
      },
    });
  }

  return {
    leadId,
    websiteReachable: site.reachable,
    signalsDetected: signalsToCreate.length,
    signalCodes: codes,
    scores: scoreResult?.scores ?? null,
    contactInfo,
    socialLinks,
  };
}
