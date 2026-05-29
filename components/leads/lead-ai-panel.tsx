"use client";

import { useState } from "react";
import type { LeadUi } from "@/types/lead-ui";

type AiView = {
  id?: string;
  emailSubject?: string | null;
  emailBody?: string | null;
  sms?: string | null;
  linkedInMessage?: string | null;
  callAngle?: string | null;
  miniAudit?: string | null;
  objections?: string[];
  cta?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePossibleJson(value: unknown): unknown {
  if (!value) return null;

  if (isRecord(value)) return value;

  if (typeof value !== "string") return null;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function extractPayload(output: unknown): Record<string, unknown> | null {
  if (!isRecord(output)) {
    const parsed = parsePossibleJson(output);
    return isRecord(parsed) ? parsed : null;
  }

  const directContent =
    output.content ??
    output.output ??
    output.payload ??
    output.data ??
    output.result;

  const parsedContent = parsePossibleJson(directContent);

  if (isRecord(parsedContent)) {
    return parsedContent;
  }

  return output;
}

function normalizeAiOutputs(input: unknown[] | undefined): AiView[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((output, index): AiView | null => {
      const payload = extractPayload(output);

      if (!payload) return null;

      const email = isRecord(payload.email) ? payload.email : null;
      const linkedin = isRecord(payload.linkedin) ? payload.linkedin : null;
      const call = isRecord(payload.call) ? payload.call : null;
      const audit = isRecord(payload.miniAudit) ? payload.miniAudit : null;

      const emailSubject =
        getString(payload.emailSubject) ??
        getString(payload.subject) ??
        getString(email?.subject);

      const emailBody =
        getString(payload.emailBody) ??
        getString(payload.body) ??
        getString(email?.body);

      const sms =
        getString(payload.sms) ??
        getString(payload.smsMessage) ??
        getString(payload.textMessage);

      const linkedInMessage =
        getString(payload.linkedInMessage) ??
        getString(payload.linkedinMessage) ??
        getString(payload.linkedin_message) ??
        getString(linkedin?.message);

      const callAngle =
        getString(payload.callAngle) ??
        getString(payload.call_angle) ??
        getString(call?.angle) ??
        getString(call?.script);

      const miniAudit =
        getString(payload.miniAudit) ??
        getString(payload.mini_audit) ??
        getString(payload.audit) ??
        getString(audit?.summary) ??
        getString(audit?.content);

      const objections =
        getStringArray(payload.objections).length > 0
          ? getStringArray(payload.objections)
          : getStringArray(payload.commonObjections);

      const cta =
        getString(payload.cta) ??
        getString(payload.callToAction) ??
        getString(payload.nextStep);

      const hasContent =
        emailSubject ||
        emailBody ||
        sms ||
        linkedInMessage ||
        callAngle ||
        miniAudit ||
        objections.length > 0 ||
        cta;

      if (!hasContent) return null;

      const id =
        isRecord(output) && typeof output.id === "string"
          ? output.id
          : String(index);

      return {
        id,
        emailSubject,
        emailBody,
        sms,
        linkedInMessage,
        callAngle,
        miniAudit,
        objections,
        cta,
      };
    })
    .filter((item): item is AiView => item !== null);
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
    >
      {copied ? "Copié" : "Copier"}
    </button>
  );
}

function AiSection({
  title,
  value,
  multiline = true,
}: {
  title: string;
  value?: string | null;
  multiline?: boolean;
}) {
  if (!value) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          {title}
        </p>
        <CopyButton value={value} />
      </div>

      <p
        className={
          multiline
            ? "whitespace-pre-wrap text-sm leading-6 text-slate-300"
            : "text-sm font-medium text-white"
        }
      >
        {value}
      </p>
    </div>
  );
}

export function LeadAiPanel({ lead }: { lead: LeadUi }) {
  const outputs = normalizeAiOutputs(lead.aiOutputs);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">IA commerciale</h2>
          <p className="mt-1 text-sm text-slate-400">
            Messages, angles d’approche et synthèse commerciale générés pour ce lead.
          </p>
        </div>

        {outputs.length > 0 && (
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-400">
            {outputs.length} sortie{outputs.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {!outputs.length ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-5">
          <p className="text-sm font-medium text-slate-300">
            Aucun contenu IA disponible.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Lance le moteur commercial IA pour générer les messages d’approche.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {outputs.map((output) => (
            <div
              key={output.id}
              className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
            >
              <AiSection
                title="Email — objet"
                value={output.emailSubject}
                multiline={false}
              />

              <AiSection title="Email — corps" value={output.emailBody} />

              <AiSection title="SMS" value={output.sms} />

              <AiSection
                title="Message LinkedIn"
                value={output.linkedInMessage}
              />

              <AiSection title="Angle d’appel" value={output.callAngle} />

              <AiSection title="Mini audit" value={output.miniAudit} />

              {(output.objections ?? []).length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Objections
                    </p>
                    <CopyButton value={(output.objections ?? []).join("\n")} />
                  </div>

                  <ul className="space-y-2 text-sm text-slate-300">
                    {(output.objections ?? []).map((objection, index) => (
                      <li key={`${objection}-${index}`} className="leading-6">
                        • {objection}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <AiSection title="CTA" value={output.cta} multiline={false} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
// ── Composant Analyse approfondie ─────────────────────────────

type DeepAnalysisOpportunity = {
  title: string;
  description: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  effort: "HIGH" | "MEDIUM" | "LOW";
};

type DeepAnalysisAction = {
  action: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  effort: "HIGH" | "MEDIUM" | "LOW";
};

type DeepAnalysisSection = {
  score: number;
  findings: string[];
};

type DeepAnalysis = {
  type: "deep_analysis";
  digitalMaturityScore: number;
  confidenceScore: number;
  confidenceLevel: "high" | "medium" | "low";
  confidenceDetails: string;
  diagnostic: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: DeepAnalysisOpportunity[];
  seoAnalysis: DeepAnalysisSection;
  contentAnalysis: DeepAnalysisSection;
  socialAnalysis: DeepAnalysisSection;
  technicalAnalysis: DeepAnalysisSection & { responseTimeMs: number; isHttps: boolean };
  sectorBenchmark: string;
  commercialAngle: string;
  priorityActions: DeepAnalysisAction[];
};

function isDeepAnalysis(value: unknown): value is DeepAnalysis {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as Record<string, unknown>).type === "deep_analysis"
  );
}

function parseDeepAnalysis(diagnostic: string | null | undefined): DeepAnalysis | null {
  if (!diagnostic) return null;
  try {
    const parsed: unknown = JSON.parse(diagnostic);
    return isDeepAnalysis(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const IMPACT_COLORS: Record<string, string> = {
  HIGH: "text-red-400 border-red-500/30 bg-red-500/8",
  MEDIUM: "text-amber-400 border-amber-500/30 bg-amber-500/8",
  LOW: "text-blue-400 border-blue-500/30 bg-blue-500/8",
};

const IMPACT_LABELS: Record<string, string> = {
  HIGH: "Impact fort",
  MEDIUM: "Impact moyen",
  LOW: "Impact faible",
};

const EFFORT_LABELS: Record<string, string> = {
  HIGH: "Effort élevé",
  MEDIUM: "Effort moyen",
  LOW: "Effort faible",
};

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 overflow-hidden rounded-full bg-slate-800/60" style={{ height: 6 }}>
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${score}%`, transition: "width 0.6s ease" }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold tabular-nums text-slate-300">
        {score}/100
      </span>
    </div>
  );
}

function DeepAnalysisView({ analysis }: { analysis: DeepAnalysis }) {
  const confidenceColor =
    analysis.confidenceLevel === "high"
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/8"
      : analysis.confidenceLevel === "medium"
        ? "text-amber-400 border-amber-500/30 bg-amber-500/8"
        : "text-red-400 border-red-500/30 bg-red-500/8";

  return (
    <div className="space-y-4">
      {/* Header scores */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
            Maturité digitale
          </p>
          <p className="text-3xl font-bold text-white">
            {analysis.digitalMaturityScore}
            <span className="text-lg text-slate-500">/100</span>
          </p>
          <ScoreBar
            score={analysis.digitalMaturityScore}
            color={
              analysis.digitalMaturityScore >= 70
                ? "bg-emerald-500"
                : analysis.digitalMaturityScore >= 40
                  ? "bg-amber-500"
                  : "bg-red-500"
            }
          />
        </div>
        <div className={`rounded-xl border p-4 ${confidenceColor}`}>
          <p className="mb-2 text-xs uppercase tracking-wider opacity-70">
            Indice de confiance
          </p>
          <p className="text-3xl font-bold">
            {analysis.confidenceScore}
            <span className="text-lg opacity-60">/100</span>
          </p>
          <p className="mt-1 text-xs opacity-70">{analysis.confidenceDetails}</p>
        </div>
      </div>

      {/* Diagnostic */}
      {analysis.diagnostic && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-500">Diagnostic</p>
            <CopyButton value={analysis.diagnostic} />
          </div>
          <p className="text-sm leading-6 text-slate-300">{analysis.diagnostic}</p>
        </div>
      )}

      {/* Scores par dimension */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="mb-4 text-xs uppercase tracking-wider text-slate-500">
          Scores par dimension
        </p>
        <div className="space-y-3">
          {[
            { label: "SEO", score: analysis.seoAnalysis.score, color: "bg-blue-500" },
            { label: "Contenu", score: analysis.contentAnalysis.score, color: "bg-purple-500" },
            { label: "Social", score: analysis.socialAnalysis.score, color: "bg-pink-500" },
            { label: "Technique", score: analysis.technicalAnalysis.score, color: "bg-cyan-500" },
          ].map(({ label, score, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-16 text-xs text-slate-400">{label}</span>
              <ScoreBar score={score} color={color} />
            </div>
          ))}
        </div>
        {analysis.technicalAnalysis.responseTimeMs > 0 && (
          <div className="mt-3 flex gap-3 text-xs text-slate-500">
            <span>
              Réponse :{" "}
              <span
                className={
                  analysis.technicalAnalysis.responseTimeMs > 3000
                    ? "text-red-400"
                    : analysis.technicalAnalysis.responseTimeMs > 1000
                      ? "text-amber-400"
                      : "text-emerald-400"
                }
              >
                {analysis.technicalAnalysis.responseTimeMs}ms
              </span>
            </span>
            <span>
              HTTPS :{" "}
              <span className={analysis.technicalAnalysis.isHttps ? "text-emerald-400" : "text-red-400"}>
                {analysis.technicalAnalysis.isHttps ? "Oui" : "Non"}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Forces et faiblesses */}
      <div className="grid grid-cols-2 gap-3">
        {analysis.strengths.length > 0 && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Forces
            </p>
            <ul className="space-y-2">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-emerald-300/80">
                  <span className="mt-0.5 flex-shrink-0">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {analysis.weaknesses.length > 0 && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-red-400">
              Faiblesses
            </p>
            <ul className="space-y-2">
              {analysis.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-red-300/80">
                  <span className="mt-0.5 flex-shrink-0">✕</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Opportunités */}
      {analysis.opportunities.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">
            Opportunités commerciales
          </p>
          <div className="space-y-3">
            {analysis.opportunities.map((opp, i) => (
              <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{opp.title}</p>
                  <div className="flex gap-1.5">
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${IMPACT_COLORS[opp.impact]}`}>
                      {IMPACT_LABELS[opp.impact]}
                    </span>
                    <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                      {EFFORT_LABELS[opp.effort]}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-400">{opp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions prioritaires */}
      {analysis.priorityActions.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">
            Actions prioritaires
          </p>
          <div className="space-y-2">
            {analysis.priorityActions.map((action, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
                  {i + 1}
                </span>
                <p className="flex-1 text-sm text-slate-300">{action.action}</p>
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${IMPACT_COLORS[action.impact]}`}>
                  {IMPACT_LABELS[action.impact]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Benchmark secteur + angle commercial */}
      {analysis.sectorBenchmark && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            Benchmark secteur
          </p>
          <p className="text-xs text-blue-300/80">{analysis.sectorBenchmark}</p>
        </div>
      )}

      {analysis.commercialAngle && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              Angle commercial recommandé
            </p>
            <CopyButton value={analysis.commercialAngle} />
          </div>
          <p className="text-xs italic text-purple-300/80">{analysis.commercialAngle}</p>
        </div>
      )}
    </div>
  );
}

// ── Export principal ───────────────────────────────────────────

export function LeadAiPanelFull({ lead }: { lead: LeadUi }) {
  const [activeTab, setActiveTab] = useState<"commercial" | "deep">("commercial");

  const allOutputs = lead.aiOutputs ?? [];

  // Séparer les deux types
  const deepOutputs = allOutputs.filter((output) => {
    if (!isRecord(output)) return false;
    const diagnostic = getString(output.diagnostic);
    if (!diagnostic) return false;
    try {
      const parsed: unknown = JSON.parse(diagnostic);
      return isDeepAnalysis(parsed);
    } catch {
      return false;
    }
  });

  const commercialOutputs = allOutputs.filter((output) => {
    if (!isRecord(output)) return false;
    const channel = output.channel;
    return channel !== "deep_analysis";
  });

  const latestDeep = deepOutputs[0];
  const deepAnalysis = latestDeep && isRecord(latestDeep)
    ? parseDeepAnalysis(getString(latestDeep.diagnostic))
    : null;

  const commercialViews = normalizeAiOutputs(commercialOutputs);

  const hasDeep = Boolean(deepAnalysis);
  const hasCommercial = commercialViews.length > 0;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">IA commerciale</h2>
          <p className="mt-1 text-sm text-slate-400">
            Approches commerciales et analyse approfondie générées par IA.
          </p>
        </div>
        {(hasDeep || hasCommercial) && (
          <div className="flex gap-1 rounded-xl border border-slate-700 bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("commercial")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "commercial"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Approche {hasCommercial && `(${commercialViews.length})`}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("deep")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "deep"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Analyse {hasDeep && "✓"}
            </button>
          </div>
        )}
      </div>

      {/* Onglet Approche commerciale */}
      {activeTab === "commercial" && (
        <>
          {!hasCommercial ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-5">
              <p className="text-sm font-medium text-slate-300">Aucun contenu IA disponible.</p>
              <p className="mt-1 text-sm text-slate-500">
                Lance le moteur commercial IA pour générer les messages d'approche.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {commercialViews.map((output) => (
                <div key={output.id} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                  <AiSection title="Email — objet" value={output.emailSubject} multiline={false} />
                  <AiSection title="Email — corps" value={output.emailBody} />
                  <AiSection title="SMS" value={output.sms} />
                  <AiSection title="Message LinkedIn" value={output.linkedInMessage} />
                  <AiSection title="Angle d'appel" value={output.callAngle} />
                  <AiSection title="Mini audit" value={output.miniAudit} />
                  {(output.objections ?? []).length > 0 && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-wider text-slate-500">Objections</p>
                        <CopyButton value={(output.objections ?? []).join("\n")} />
                      </div>
                      <ul className="space-y-2 text-sm text-slate-300">
                        {(output.objections ?? []).map((objection, index) => (
                          <li key={`${objection}-${index}`} className="leading-6">• {objection}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <AiSection title="CTA" value={output.cta} multiline={false} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Onglet Analyse approfondie */}
      {activeTab === "deep" && (
        <>
          {!hasDeep ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-5">
              <p className="text-sm font-medium text-slate-300">Aucune analyse approfondie disponible.</p>
              <p className="mt-1 text-sm text-slate-500">
                Lance "Analyse approfondie" pour obtenir un audit digital complet avec indice de confiance.
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <DeepAnalysisView analysis={deepAnalysis!} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
