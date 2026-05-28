import { prisma } from "@/lib/prisma";
import { analyzeBooking } from "../analyzers/website/booking-analyzer";
import { analyzeChatbot } from "../analyzers/website/chatbot-analyzer";
import { analyzeMobile } from "../analyzers/website/mobile-analyzer";
import { analyzeSpeed } from "../analyzers/website/speed-analyzer";
import { analyzeSsl } from "../analyzers/website/ssl-analyzer";
import { analyzeWebsite } from "../analyzers/website/website-analyzer";
import { analyzeSeo } from "../analyzers/seo/seo-analyzer";
import { analyzeSocial } from "../analyzers/social/social-analyzer";
import { analyzeCommunity } from "../analyzers/community/discord-analyzer";
import { analyzeSlack } from "../analyzers/community/slack-analyzer";
import { analyzeDirectories } from "../analyzers/directories/pages-jaunes-analyzer";
import { analyzeSolocal } from "../analyzers/directories/solocal-analyzer";
import { analyzeLeboncoin } from "../analyzers/directories/leboncoin-analyzer";
import { analyzeReputation } from "../analyzers/reputation/reputation-analyzer";
import { persistDetectedSignals } from "./persistence";
import { dedupeSignals } from "./normalizer";
import type { LeadSignalInput, NormalizedSignal, SignalAnalyzer, SignalEngineResult } from "./types";
import { extractChannels } from "../utils/channel-utils";
import { fetchHtmlSnapshot } from "../utils/fetch-html";

const ANALYZERS: SignalAnalyzer[] = [
  analyzeWebsite,
  analyzeSsl,
  analyzeSpeed,
  analyzeMobile,
  analyzeChatbot,
  analyzeBooking,
  analyzeSeo,
  analyzeSocial,
  analyzeCommunity,
  analyzeSlack,
  analyzeDirectories,
  analyzeSolocal,
  analyzeLeboncoin,
  analyzeReputation,
];

export async function analyzeLeadSignals(lead: LeadSignalInput): Promise<SignalEngineResult> {
  const channels = extractChannels(lead.channels, lead.rawPayload, lead.metadata);
  const websiteSnapshot = lead.website ? await fetchHtmlSnapshot(lead.website) : null;

  const signals: NormalizedSignal[] = [];

  for (const analyzer of ANALYZERS) {
    if (!analyzer.enabled) {
      continue;
    }

    const result = await analyzer.analyze({
      lead,
      websiteSnapshot,
      channels,
    });

    signals.push(...result);
  }

  const normalizedSignals = dedupeSignals(signals);
  const persisted = await persistDetectedSignals(lead.id, normalizedSignals);

  await prisma.lead.update({
    where: {
      id: lead.id,
    },
    data: {
      lastActivityAt: new Date(),
    },
  });

  return {
    detectedCount: normalizedSignals.filter((signal) => signal.detected).length,
    persistedCount: persisted.length,
    channelsAnalyzed: buildChannelsAnalyzed(lead, channels, Boolean(websiteSnapshot)),
    signals: normalizedSignals,
  };
}

function buildChannelsAnalyzed(
  lead: LeadSignalInput,
  channels: Record<string, string | null | undefined>,
  hasWebsiteSnapshot: boolean,
): string[] {
  const analyzed = new Set<string>();

  if (lead.sourceChannel) {
    analyzed.add(lead.sourceChannel);
  }

  if (hasWebsiteSnapshot) {
    analyzed.add("website");
  }

  for (const key of Object.keys(channels)) {
    analyzed.add(key);
  }

  return Array.from(analyzed);
}