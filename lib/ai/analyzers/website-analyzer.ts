import type { ExtractedContent } from "@/lib/signals/content-extractor";
import type { SocialAnalysis } from "@/lib/signals/social-fetcher";
import type { ConfidenceResult } from "@/lib/signals/confidence-calculator";
import { AiEngineError } from "@/lib/ai/utils";
import { ensureEnv } from "@/lib/ai/utils";

export type DeepAnalysisResult = {
  digitalMaturityScore: number;
  confidenceScore: number;
  confidenceLevel: "high" | "medium" | "low";
  confidenceDetails: string;

  diagnostic: string;

  strengths: string[];
  weaknesses: string[];

  opportunities: Array<{
    title: string;
    description: string;
    impact: "HIGH" | "MEDIUM" | "LOW";
    effort: "HIGH" | "MEDIUM" | "LOW";
  }>;

  seoAnalysis: {
    score: number;
    findings: string[];
  };

  contentAnalysis: {
    score: number;
    findings: string[];
  };

  socialAnalysis: {
    score: number;
    findings: string[];
  };

  technicalAnalysis: {
    score: number;
    responseTimeMs: number;
    isHttps: boolean;
    findings: string[];
  };

  sectorBenchmark: string;
  commercialAngle: string;

  priorityActions: Array<{
    action: string;
    impact: "HIGH" | "MEDIUM" | "LOW";
    effort: "HIGH" | "MEDIUM" | "LOW";
  }>;

  provider: string;
  modelUsed: string;
};

function buildAnalysisPrompt(params: {
  leadName: string;
  sector: string | null;
  city: string | null;
  website: string | null;
  content: ExtractedContent | null;
  signals: Array<{ code: string; label: string; category: string | null; evidence: string | null }>;
  socials: SocialAnalysis[];
  confidence: ConfidenceResult;
}): string {
  const { leadName, sector, city, website, content, signals, socials, confidence } = params;

  const seoSection = content
    ? `
## Données SEO et techniques
- Title : ${content.title ?? "Absent"}
- Meta description : ${content.metaDescription ?? "Absente"}
- H1 : ${content.h1.join(", ") || "Absent"}
- H2 principaux : ${content.h2.slice(0, 5).join(", ") || "Aucun"}
- Schema.org : ${content.hasSchema ? content.schemaTypes.join(", ") : "Absent"}
- Canonical : ${content.canonicalUrl ?? "Absent"}
- Open Graph : ${content.ogTitle ? "Présent" : "Absent"}
- HTTPS : ${content.isHttps ? "Oui" : "Non"}
- Sitemap.xml : ${content.hasSitemap ? "Présent" : "Absent"}
- Robots.txt : ${content.hasRobotsTxt ? "Présent" : "Absent"}
- Temps de réponse : ${content.responseTimeMs}ms
- Images total : ${content.imagesTotal} dont ${content.imagesWithAlt} avec alt
- Liens internes : ${content.internalLinks} / Liens externes : ${content.externalLinks}
- Nombre de mots estimé : ${content.wordCount}

## Signaux esthétiques et modernité du design
- Tables pour mise en page : ${content.hasTablesForLayout ? "Oui — design vieillissant" : "Non"}
- CSS inline excessif : ${content.hasCssInline ? "Oui — manque de maintenabilité" : "Non"}
- Frameset détecté : ${content.hasFrameset ? "Oui — très vieux site" : "Non"}
- Flash détecté : ${content.hasFlash ? "Oui — technologie obsolète" : "Non"}
- Viewport meta (responsive) : ${content.hasViewportMeta ? "Présent" : "Absent — probablement non mobile-friendly"}
- Media queries CSS : ${content.hasMediaQueries ? "Présent" : "Absent"}
- Framework CSS : ${content.hasBootstrap ? "Bootstrap" : content.hasTailwind ? "Tailwind" : "Aucun détecté"}
- Site builder détecté : ${content.builderDetected ?? "Aucun"}
- Nombre de familles de polices : ${content.fontFamiliesCount} ${content.fontFamiliesCount > 4 ? "(trop élevé — incohérence visuelle probable)" : ""}`
    : "## Site inaccessible — pas de données techniques disponibles";

  const contentSection = content?.bodyText
    ? `
## Contenu de la page d'accueil (extrait)
${content.bodyText.slice(0, 1500)}`
    : "";

  const signalsSection =
    signals.length > 0
      ? `
## Signaux faibles détectés
${signals.map((s) => `- ${s.label} (${s.category ?? "général"})${s.evidence ? ` : ${s.evidence}` : ""}`).join("\n")}`
      : "## Aucun signal faible détecté";

  const socialsSection =
    socials.length > 0
      ? `
## Présence réseaux sociaux
${socials
  .map(
    (s) =>
      `- ${s.platform} : ${s.accessible ? "accessible" : "inaccessible"}${s.name ? ` — ${s.name}` : ""}${s.followersEstimate ? ` — ~${s.followersEstimate} abonnés` : ""}${s.description ? ` — ${s.description.slice(0, 200)}` : ""}`,
  )
  .join("\n")}`
      : "## Aucun réseau social détecté sur le site";

  return `Tu es un expert en stratégie digitale et développement commercial B2B.

Tu dois produire une analyse approfondie et honnête de la présence digitale de cette entreprise.

## Lead
- Nom : ${leadName}
- Secteur : ${sector ?? "Non renseigné"}
- Ville : ${city ?? "Non renseignée"}
- Site web : ${website ?? "Non renseigné"}

## Indice de confiance des données
- Score : ${confidence.score}/100 (${confidence.level === "high" ? "Élevé" : confidence.level === "medium" ? "Moyen" : "Faible"})
- Détails : ${confidence.details}

${seoSection}
${contentSection}
${signalsSection}
${socialsSection}

## Instructions

Produis une analyse structurée et honnête. Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks.

Format exact :
{
  "digitalMaturityScore": 0-100,
  "diagnostic": "Paragraphe de synthèse (4-6 phrases, ton professionnel, basé uniquement sur les données disponibles)",
  "strengths": ["Force 1", "Force 2", "Force 3"],
  "weaknesses": ["Faiblesse 1", "Faiblesse 2", "Faiblesse 3"],
  "opportunities": [
    {"title": "...", "description": "...", "impact": "HIGH|MEDIUM|LOW", "effort": "HIGH|MEDIUM|LOW"}
  ],
  "seoAnalysis": {
    "score": 0-100,
    "findings": ["Observation SEO 1", "Observation SEO 2"]
  },
  "contentAnalysis": {
    "score": 0-100,
    "findings": ["Observation contenu 1", "Observation contenu 2"]
  },
  "socialAnalysis": {
    "score": 0-100,
    "findings": ["Observation sociale 1", "Observation sociale 2"]
  },
  "technicalAnalysis": {
    "score": 0-100,
    "findings": ["Observation technique 1", "Observation technique 2"]
  },
  "sectorBenchmark": "Comparaison avec le standard du secteur (2-3 phrases)",
  "commercialAngle": "Angle d'approche commerciale recommandé basé sur cette analyse (2-3 phrases)",
  "priorityActions": [
    {"action": "...", "impact": "HIGH|MEDIUM|LOW", "effort": "HIGH|MEDIUM|LOW"}
  ]
}

Règles absolues :
- Ne jamais inventer de données non présentes
- Si les données sont limitées, le dire dans le diagnostic
- Adapter le benchmark au secteur réel
- Les opportunités doivent être concrètes et actionnables
- Tout en français
- Maximum 3 forces, 3 faiblesses, 5 opportunités, 5 actions prioritaires`;
}

export async function analyzeWebsiteWithClaude(params: {
  leadName: string;
  sector: string | null;
  city: string | null;
  website: string | null;
  content: ExtractedContent | null;
  signals: Array<{ code: string; label: string; category: string | null; evidence: string | null }>;
  socials: SocialAnalysis[];
  confidence: ConfidenceResult;
  responseTimeMs: number;
}): Promise<DeepAnalysisResult> {
  const apiKey = ensureEnv("ANTHROPIC_API_KEY");
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-5-20251101";

  const prompt = buildAnalysisPrompt(params);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const json: unknown = await response.json();

  if (!response.ok) {
    console.error("[website-analyzer] Claude API error", response.status, JSON.stringify(json));
    throw new AiEngineError(
      "AI_PROVIDER_ERROR",
      `Claude API error ${response.status}: ${JSON.stringify(json)}`,
      { status: response.status, body: json },
    );
  }

  const content =
    typeof json === "object" &&
    json !== null &&
    "content" in json &&
    Array.isArray((json as { content: unknown }).content)
      ? (json as { content: Array<{ type: string; text?: string }> }).content
      : [];

  const textBlock = content.find((b) => b.type === "text");
  if (!textBlock?.text) {
    throw new AiEngineError("AI_PROVIDER_RESPONSE_INVALID", "Réponse Claude vide.");
  }

  let parsed: Record<string, unknown>;
  try {
    const cleaned = textBlock.text
      .replace(/^```(?:json)?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    throw new AiEngineError("AI_PROVIDER_RESPONSE_INVALID", "JSON invalide dans la réponse Claude.");
  }

  const getString = (v: unknown): string =>
    typeof v === "string" ? v : "";
  const getNumber = (v: unknown): number =>
    typeof v === "number" ? Math.max(0, Math.min(100, v)) : 0;
  const getStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  type OpportunityItem = { title: string; description: string; impact: "HIGH" | "MEDIUM" | "LOW"; effort: "HIGH" | "MEDIUM" | "LOW" };
  type ActionItem = { action: string; impact: "HIGH" | "MEDIUM" | "LOW"; effort: "HIGH" | "MEDIUM" | "LOW" };

  const parseImpactEffort = (v: unknown): "HIGH" | "MEDIUM" | "LOW" => {
    if (v === "HIGH" || v === "MEDIUM" || v === "LOW") return v;
    return "MEDIUM";
  };

  const parseOpportunities = (v: unknown): OpportunityItem[] => {
    if (!Array.isArray(v)) return [];
    return v
      .filter((item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
      )
      .map((item) => ({
        title: getString(item.title),
        description: getString(item.description),
        impact: parseImpactEffort(item.impact),
        effort: parseImpactEffort(item.effort),
      }))
      .filter((item) => item.title);
  };

  const parseActions = (v: unknown): ActionItem[] => {
    if (!Array.isArray(v)) return [];
    return v
      .filter((item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
      )
      .map((item) => ({
        action: getString(item.action),
        impact: parseImpactEffort(item.impact),
        effort: parseImpactEffort(item.effort),
      }))
      .filter((item) => item.action);
  };

  const parseAnalysisSection = (v: unknown): { score: number; findings: string[] } => {
    if (typeof v === "object" && v !== null) {
      const obj = v as Record<string, unknown>;
      return {
        score: getNumber(obj.score),
        findings: getStringArray(obj.findings),
      };
    }
    return { score: 0, findings: [] };
  };

  return {
    digitalMaturityScore: getNumber(parsed.digitalMaturityScore),
    confidenceScore: params.confidence.score,
    confidenceLevel: params.confidence.level,
    confidenceDetails: params.confidence.details,
    diagnostic: getString(parsed.diagnostic),
    strengths: getStringArray(parsed.strengths),
    weaknesses: getStringArray(parsed.weaknesses),
    opportunities: parseOpportunities(parsed.opportunities),
    seoAnalysis: parseAnalysisSection(parsed.seoAnalysis),
    contentAnalysis: parseAnalysisSection(parsed.contentAnalysis),
    socialAnalysis: parseAnalysisSection(parsed.socialAnalysis),
    technicalAnalysis: {
      ...parseAnalysisSection(parsed.technicalAnalysis),
      responseTimeMs: params.responseTimeMs,
      isHttps: params.content?.isHttps ?? false,
    },
    sectorBenchmark: getString(parsed.sectorBenchmark),
    commercialAngle: getString(parsed.commercialAngle),
    priorityActions: parseActions(parsed.priorityActions),
    provider: "claude",
    modelUsed: model,
  };
}
