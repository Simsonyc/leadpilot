"use client";

import type { LeadUi, LeadTimelineEventUi } from "@/types/lead-ui";

// ── Helpers ────────────────────────────────────────────────────

function formatDate(value?: string | Date | null): string {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function toTimestamp(value?: string | Date | null): number {
  if (!value) return 0;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

// ── Config visuelle par type d'événement ───────────────────────

type EventVisual = {
  icon: string;
  border: string;
  bg: string;
  dot: string;
  label: string;
};

const TYPE_VISUAL: Record<string, EventVisual> = {
  STATUS_CHANGED: {
    icon: "↔",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    dot: "bg-blue-400",
    label: "Statut modifié",
  },
  SCORE_UPDATED: {
    icon: "◎",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    dot: "bg-emerald-400",
    label: "Score recalculé",
  },
  SIGNALS_ANALYZED: {
    icon: "⚡",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    dot: "bg-amber-400",
    label: "Signaux analysés",
  },
  AI_APPROACH_GENERATED: {
    icon: "✦",
    border: "border-purple-500/20",
    bg: "bg-purple-500/5",
    dot: "bg-purple-400",
    label: "Approche IA générée",
  },
  NOTE_ADDED: {
    icon: "✎",
    border: "border-slate-600/30",
    bg: "bg-slate-800/40",
    dot: "bg-slate-400",
    label: "Note ajoutée",
  },
  NEXT_ACTION_CREATED: {
    icon: "+",
    border: "border-cyan-500/20",
    bg: "bg-cyan-500/5",
    dot: "bg-cyan-400",
    label: "Action créée",
  },
  NEXT_ACTION_COMPLETED: {
    icon: "✓",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    dot: "bg-emerald-400",
    label: "Action terminée",
  },
  NEXT_ACTION_DELETED: {
    icon: "✕",
    border: "border-red-500/20",
    bg: "bg-red-500/5",
    dot: "bg-red-400",
    label: "Action supprimée",
  },
};

const DEFAULT_VISUAL: EventVisual = {
  icon: "·",
  border: "border-slate-700",
  bg: "bg-slate-900/40",
  dot: "bg-slate-500",
  label: "Événement",
};

function getVisual(type?: string | null): EventVisual {
  if (!type) return DEFAULT_VISUAL;
  return TYPE_VISUAL[type] ?? DEFAULT_VISUAL;
}

// ── Normalisation des LeadEvent (unknown[]) ─────────────────────

type NormalizedEvent = {
  id: string;
  type: string | null;
  label: string;
  description: string | null;
  date: string | Date | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function getString(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v : null;
}

function getDateValue(v: unknown): string | Date | null {
  if (typeof v === "string" || v instanceof Date) return v;
  return null;
}

function normalizeEvents(raw: unknown[] | undefined): NormalizedEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i): NormalizedEvent | null => {
      if (!isRecord(item)) return null;
      return {
        id: getString(item.id) ?? `event-${i}`,
        type: getString(item.type),
        label:
          getString(item.title) ??
          getString(item.label) ??
          getString(item.type) ??
          "Événement",
        description:
          getString(item.description) ??
          getString(item.message) ??
          getString(item.content) ??
          null,
        date:
          getDateValue(item.occurredAt) ??
          getDateValue(item.createdAt) ??
          null,
      };
    })
    .filter((e): e is NormalizedEvent => e !== null);
}

// ── Types internes unifiés ─────────────────────────────────────

type UnifiedItem = {
  id: string;
  type: string | null;
  label: string;
  description: string | null;
  date: string | Date | null;
  source: "timeline" | "event";
};

function fromTimeline(events: LeadTimelineEventUi[]): UnifiedItem[] {
  return events.map((e) => ({
    id: e.id,
    type: e.type ?? null,
    label: e.label ?? "Événement",
    description: null,
    date: e.createdAt ?? null,
    source: "timeline" as const,
  }));
}

function fromEvents(raw: unknown[] | undefined): UnifiedItem[] {
  return normalizeEvents(raw).map((e) => ({
    ...e,
    source: "event" as const,
  }));
}

// ── Composant ──────────────────────────────────────────────────

export function LeadEventsPanel({ lead }: { lead: LeadUi }) {
  const timelineItems = fromTimeline(lead.timelineEvents ?? []);
  const eventItems = fromEvents(lead.events);

  const allItems = [...timelineItems, ...eventItems].sort(
    (a, b) => toTimestamp(b.date) - toTimestamp(a.date),
  );

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Timeline activité
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Historique complet des événements et actions.
          </p>
        </div>

        {allItems.length > 0 && (
          <span className="flex-shrink-0 rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-400">
            {allItems.length}
          </span>
        )}
      </div>

      {/* Empty state */}
      {allItems.length === 0 && (
        <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-5">
          <p className="text-sm font-medium text-slate-300">
            Aucune activité enregistrée.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Les analyses, scores, approches IA et actions apparaîtront ici.
          </p>
        </div>
      )}

      {/* Liste */}
      {allItems.length > 0 && (
        <div className="mt-5 space-y-3">
          {allItems.map((item) => {
            const visual = getVisual(item.type);

            return (
              <div
                key={`${item.source}-${item.id}`}
                className="relative border-l border-slate-700/50 pl-4"
              >
                {/* Dot */}
                <span
                  className={`absolute -left-[5px] top-[10px] h-2.5 w-2.5 rounded-full ${visual.dot}`}
                />

                {/* Card */}
                <div
                  className={`rounded-xl border p-4 ${visual.border} ${visual.bg}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex-shrink-0 text-sm leading-none text-slate-300">
                        {visual.icon}
                      </span>
                      <p className="text-sm font-semibold text-white truncate">
                        {item.label}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-[10px] text-slate-500">
                      {formatDate(item.date)}
                    </span>
                  </div>

                  {item.description && (
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-400">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
