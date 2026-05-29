export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/utils";
import { fetchWebsite } from "@/lib/signals/website-fetcher";
import { extractContent, checkSitemap, checkRobotsTxt } from "@/lib/signals/content-extractor";
import { extractSocialLinks } from "@/lib/signals/signal-detectors";
import { analyzeSocialLinks } from "@/lib/signals/social-fetcher";
import { calculateConfidence } from "@/lib/signals/confidence-calculator";
import { analyzeWebsiteWithClaude } from "@/lib/ai/analyzers/website-analyzer";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const lead = await prisma.lead.findFirst({
      where: { id, deletedAt: null },
      include: {
        weakSignals: {
          include: { weakSignal: true },
          orderBy: { weightApplied: "desc" },
          take: 15,
        },
      },
    });

    if (!lead) return errorResponse("Lead introuvable.", 404);
    if (!lead.website) return errorResponse("Aucun site web renseigné pour ce lead.", 400);

    // 1. Fetch du site avec mesure du temps de réponse
    const fetchStart = Date.now();
    const site = await fetchWebsite(lead.website);
    const responseTimeMs = Date.now() - fetchStart;

    // 2. Extraction du contenu
    let content = null;
    if (site.reachable) {
      content = extractContent(site.html, site.$, site.url, responseTimeMs);

      // Vérification sitemap et robots.txt en parallèle
      const [hasSitemap, hasRobotsTxt] = await Promise.all([
        checkSitemap(site.url),
        checkRobotsTxt(site.url),
      ]);

      content.hasSitemap = hasSitemap;
      content.hasRobotsTxt = hasRobotsTxt;
    }

    // 3. Extraction et analyse des réseaux sociaux
    const socialLinks = site.reachable
      ? extractSocialLinks(site.$, site.url)
      : { facebook: null, instagram: null, linkedin: null, twitter: null, youtube: null, tiktok: null };

    const socialAnalyses = await analyzeSocialLinks(socialLinks);

    // 4. Calcul de l'indice de confiance
    const confidence = calculateConfidence({
      siteReachable: site.reachable,
      contentExtracted: content,
      socialAnalyses,
      signalsCount: lead.weakSignals.length,
      hasGooglePlaces: false,
    });

    // 5. Analyse Claude
    const signals = lead.weakSignals.map((ws) => ({
      code: ws.weakSignal.code,
      label: ws.weakSignal.label,
      category: ws.weakSignal.category,
      evidence: ws.evidence,
    }));

    const analysis = await analyzeWebsiteWithClaude({
      leadName: lead.name,
      sector: lead.sector,
      city: lead.city,
      website: lead.website,
      content,
      signals,
      socials: socialAnalyses,
      confidence,
      responseTimeMs,
    });

    // 6. Persister dans LeadAiOutput
    const now = new Date();

    const aiOutput = await prisma.$transaction(async (tx) => {
      const output = await tx.leadAiOutput.create({
        data: {
          leadId: id,
          channel: "deep_analysis",
          diagnostic: JSON.stringify({
            type: "deep_analysis",
            digitalMaturityScore: analysis.digitalMaturityScore,
            confidenceScore: analysis.confidenceScore,
            confidenceLevel: analysis.confidenceLevel,
            confidenceDetails: analysis.confidenceDetails,
            diagnostic: analysis.diagnostic,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            opportunities: analysis.opportunities,
            seoAnalysis: analysis.seoAnalysis,
            contentAnalysis: analysis.contentAnalysis,
            socialAnalysis: analysis.socialAnalysis,
            technicalAnalysis: analysis.technicalAnalysis,
            sectorBenchmark: analysis.sectorBenchmark,
            commercialAngle: analysis.commercialAngle,
            priorityActions: analysis.priorityActions,
          }),
          modelUsed: analysis.modelUsed,
          provider: analysis.provider,
          promptVersion: "deep-analysis-v1",
        },
      });

      await tx.leadTimelineEvent.create({
        data: {
          leadId: id,
          type: "AI_APPROACH_GENERATED",
          label: `Analyse approfondie — Score maturité digitale : ${analysis.digitalMaturityScore}/100 (confiance ${analysis.confidenceScore}%)`,
          payload: {
            outputId: output.id,
            digitalMaturityScore: analysis.digitalMaturityScore,
            confidenceScore: analysis.confidenceScore,
            provider: analysis.provider,
          },
        },
      });

      await tx.lead.update({
        where: { id },
        data: { lastActivityAt: now },
      });

      return output;
    });

    return NextResponse.json({
      success: true,
      data: {
        outputId: aiOutput.id,
        ...analysis,
      },
    });
  } catch (error) {
    console.error("[POST /api/leads/[id]/analyze-deep]", error);
    return errorResponse("Erreur lors de l'analyse approfondie.");
  }
}
