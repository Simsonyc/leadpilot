"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

// ── Types ──────────────────────────────────────────────────────

type PipelineStage =
  | "TO_CONTACT"
  | "QUALIFICATION"
  | "MEETING"
  | "PROPOSAL"
  | "FOLLOW_UP"
  | "CLOSING"
  | "LOST";

type Kpis = {
  totalLeads: number;
  hotLeads: number;
  leadsWithoutAction: number;
  overdueActions: number;
  stagnantLeads: number;
  recentAiOutputs: number;
};

type PipelineItem = {
  stage: PipelineStage;
  count: number;
};

type PriorityLead = {
  id: string;
  name: string | null;
  sector: string | null;
  city: string | null;
  temperature: string | null;
  globalScore: number | null;
  pipelineStage: PipelineStage | null;
  status: string | null;
  lastActivityAt: string | Date | null;
  nextActionAt: string | Date | null;
};

type TimelineEvent = {
  id: string;
  type: string | null;
  label: string | null;
  createdAt: string | Date | null;
  lead: {
    id: string;
    name: string | null;
    pipelineStage: PipelineStage | null;
  } | null;
};

type UpcomingAction = {
  id: string;
  label: string | null;
  dueAt: string | Date | null;
  priority: string | null;
  lead: {
    id: string;
    name: string | null;
    pipelineStage: PipelineStage | null;
  } | null;
};

type DashboardData = {
  kpis: Kpis;
  recentActivity: TimelineEvent[];
  priorityLeads: PriorityLead[];
  upcomingActions: UpcomingAction[];
  pipeline: PipelineItem[];
};

// ── Helpers ────────────────────────────────────────────────────

function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatDateShort(value?: string | Date | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(date);
}

function isOverdue(value?: string | Date | null): boolean {
  if (!value) return false;
  return new Date(value).getTime() < Date.now();
}

const PIPELINE_LABELS: Record<PipelineStage, string> = {
  TO_CONTACT: "À contacter",
  QUALIFICATION: "Qualification",
  MEETING: "Meeting",
  PROPOSAL: "Proposition",
  FOLLOW_UP: "Suivi",
  CLOSING: "Closing",
  LOST: "Perdu",
};

const PIPELINE_COLORS: Record<PipelineStage, string> = {
  TO_CONTACT: "bg-slate-500",
  QUALIFICATION: "bg-blue-500",
  MEETING: "bg-indigo-500",
  PROPOSAL: "bg-purple-500",
  FOLLOW_UP: "bg-amber-500",
  CLOSING: "bg-emerald-500",
  LOST: "bg-red-500",
};

const TEMPERATURE_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  HOT: { label: "Chaud", color: "text-red-400", dot: "bg-red-400" },
  WARM: { label: "Tiède", color: "text-amber-400", dot: "bg-amber-400" },
  COLD: { label: "Froid", color: "text-blue-400", dot: "bg-blue-400" },
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "text-red-400",
  HIGH: "text-amber-400",
  MEDIUM: "text-blue-400",
  LOW: "text-slate-500",
};

const TIMELINE_ICONS: Record<string, string> = {
  STATUS_CHANGED: "↔",
  SCORE_UPDATED: "◎",
  SIGNALS_ANALYZED: "⚡",
  AI_APPROACH_GENERATED: "✦",
  NOTE_ADDED: "✎",
  NEXT_ACTION_CREATED: "+",
  NEXT_ACTION_COMPLETED: "✓",
  NEXT_ACTION_DELETED: "✕",
};

// ── Skeleton ───────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
        <div className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
        <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
      </div>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setError("");

    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      const result: unknown = await response.json();

      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("success" in result) ||
        result.success !== true ||
        !("data" in result)
      ) {
        throw new Error("Impossible de charger le dashboard.");
      }

      setData(result.data as DashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading) return <AppShell><DashboardSkeleton /></AppShell>;

  if (error || !data) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
          {error || "Données indisponibles."}
        </div>
      </AppShell>
    );
  }

  const { kpis, recentActivity, priorityLeads, upcomingActions, pipeline } = data;

  const totalPipeline = pipeline.reduce((sum, item) => sum + item.count, 0);

  return (
    <AppShell>
      <div className="min-w-0 space-y-6 overflow-hidden">

        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
              Vue stratégique
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Dashboard</h1>
          </div>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/20"
          >
            Rafraîchir
          </button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            {
              label: "Total leads",
              value: kpis.totalLeads,
              color: "text-white",
              alert: false,
            },
            {
              label: "Leads HOT",
              value: kpis.hotLeads,
              color: "text-red-400",
              alert: false,
            },
            {
              label: "Sans action",
              value: kpis.leadsWithoutAction,
              color: kpis.leadsWithoutAction > 0 ? "text-amber-400" : "text-slate-400",
              alert: kpis.leadsWithoutAction > 0,
            },
            {
              label: "Relances overdue",
              value: kpis.overdueActions,
              color: kpis.overdueActions > 0 ? "text-red-400" : "text-slate-400",
              alert: kpis.overdueActions > 0,
            },
            {
              label: "Stagnants 14j",
              value: kpis.stagnantLeads,
              color: kpis.stagnantLeads > 0 ? "text-amber-400" : "text-slate-400",
              alert: kpis.stagnantLeads > 0,
            },
            {
              label: "IA cette semaine",
              value: kpis.recentAiOutputs,
              color: "text-purple-400",
              alert: false,
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className={`rounded-2xl border p-5 ${
                kpi.alert
                  ? "border-amber-500/20 bg-amber-500/5"
                  : "border-slate-800 bg-slate-900/60"
              }`}
            >
              <p className="text-xs uppercase tracking-wider text-slate-500">
                {kpi.label}
              </p>
              <p className={`mt-3 text-3xl font-semibold ${kpi.color}`}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Pipeline global + Leads prioritaires */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Pipeline */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Pipeline global
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {totalPipeline} lead{totalPipeline > 1 ? "s" : ""} en cours
                </p>
              </div>
              <Link
                href="/leads"
                className="text-xs text-blue-400 transition-colors hover:text-blue-300"
              >
                Voir tous →
              </Link>
            </div>

            {pipeline.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">
                Aucun lead dans le pipeline.
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {(
                  [
                    "TO_CONTACT",
                    "QUALIFICATION",
                    "MEETING",
                    "PROPOSAL",
                    "FOLLOW_UP",
                    "CLOSING",
                    "LOST",
                  ] as PipelineStage[]
                ).map((stage) => {
                  const item = pipeline.find((p) => p.stage === stage);
                  const count = item?.count ?? 0;
                  const pct = totalPipeline > 0 ? (count / totalPipeline) * 100 : 0;

                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <div className="w-28 flex-shrink-0 text-xs text-slate-400">
                        {PIPELINE_LABELS[stage]}
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-2 rounded-full transition-all ${PIPELINE_COLORS[stage]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-6 flex-shrink-0 text-right text-xs font-semibold text-slate-300">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leads prioritaires */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Leads prioritaires
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  HOT ou score ≥ 70
                </p>
              </div>
              <Link
                href="/leads"
                className="text-xs text-blue-400 transition-colors hover:text-blue-300"
              >
                Voir tous →
              </Link>
            </div>

            {priorityLeads.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-5">
                <p className="text-sm text-slate-500">
                  Aucun lead prioritaire.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {priorityLeads.map((lead) => {
                  const tempConfig =
                    TEMPERATURE_CONFIG[lead.temperature ?? ""] ?? null;
                  const overdue = isOverdue(lead.nextActionAt);

                  return (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5 transition-colors hover:border-slate-700"
                    >
                      {tempConfig && (
                        <span
                          className={`h-2 w-2 flex-shrink-0 rounded-full ${tempConfig.dot}`}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {lead.name ?? "—"}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {[lead.sector, lead.city]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1">
                        {lead.globalScore !== null && (
                          <span className="text-sm font-semibold text-emerald-400">
                            {lead.globalScore}
                          </span>
                        )}
                        {lead.nextActionAt && (
                          <span
                            className={`text-[10px] ${
                              overdue ? "text-red-400" : "text-slate-600"
                            }`}
                          >
                            {overdue ? "En retard" : formatDateShort(lead.nextActionAt)}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Activité récente + Prochaines relances */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">

          {/* Activité récente */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-white">
              Activité récente
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Derniers événements sur tous les leads.
            </p>

            {recentActivity.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-5">
                <p className="text-sm text-slate-500">
                  Aucune activité enregistrée.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-2">
                {recentActivity.map((event) => {
                  const icon =
                    TIMELINE_ICONS[event.type ?? ""] ?? "·";

                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3"
                    >
                      <span className="mt-0.5 flex-shrink-0 text-sm text-slate-400">
                        {icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white">
                          {event.label ?? "Événement"}
                        </p>
                        {event.lead && (
                          <Link
                            href={`/leads/${event.lead.id}`}
                            className="truncate text-xs text-blue-400 transition-colors hover:text-blue-300"
                          >
                            {event.lead.name ?? "Lead"}
                          </Link>
                        )}
                      </div>
                      <span className="flex-shrink-0 text-[10px] text-slate-600">
                        {formatDate(event.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Prochaines relances */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-white">
              Prochaines relances
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Actions dues dans les 7 jours.
            </p>

            {upcomingActions.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-5">
                <p className="text-sm text-slate-500">
                  Aucune relance planifiée.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-2">
                {upcomingActions.map((action) => {
                  const priorityColor =
                    PRIORITY_COLORS[action.priority ?? ""] ?? "text-slate-500";

                  return (
                    <div
                      key={action.id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-3.5"
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {action.label ?? "Action"}
                          </p>
                          {action.lead && (
                            <Link
                              href={`/leads/${action.lead.id}`}
                              className="truncate text-xs text-blue-400 transition-colors hover:text-blue-300"
                            >
                              {action.lead.name ?? "Lead"}
                            </Link>
                          )}
                        </div>
                        <div className="flex flex-shrink-0 flex-col items-end gap-1">
                          <span
                            className={`text-[10px] font-semibold uppercase ${priorityColor}`}
                          >
                            {action.priority ?? ""}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatDateShort(action.dueAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
