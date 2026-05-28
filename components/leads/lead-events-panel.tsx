import type { LeadUi } from "@/types/lead-ui";

type TimelineItem = {
  id: string;
  title: string;
  description?: string | null;
  date?: string | Date | null;
  type?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getDate(value: unknown): string | Date | null {
  if (typeof value === "string" || value instanceof Date) return value;
  return null;
}

function formatDate(value?: string | Date | null) {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizeItems(values: unknown[] | undefined, fallbackType: string): TimelineItem[] {
  if (!Array.isArray(values)) return [];

  return values
    .map((item, index): TimelineItem | null => {
      if (typeof item === "string" && item.trim()) {
        return {
          id: `${fallbackType}-${index}`,
          title: item,
          type: fallbackType,
        };
      }

      if (!isRecord(item)) return null;

      return {
        id: getString(item.id) ?? `${fallbackType}-${index}`,
        title:
          getString(item.title) ??
          getString(item.label) ??
          getString(item.type) ??
          getString(item.action) ??
          fallbackType,
        description:
          getString(item.description) ??
          getString(item.message) ??
          getString(item.content) ??
          getString(item.notes),
        date:
          getDate(item.createdAt) ??
          getDate(item.updatedAt) ??
          getDate(item.date) ??
          getDate(item.dueAt),
        type: getString(item.type) ?? fallbackType,
      };
    })
    .filter((item): item is TimelineItem => item !== null);
}

export function LeadEventsPanel({ lead }: { lead: LeadUi }) {
  const items = [
    ...normalizeItems(lead.events, "event"),
    ...normalizeItems(lead.actions, "action"),
  ].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Timeline activité</h2>
          <p className="mt-1 text-sm text-slate-400">
            Historique des événements et actions du lead.
          </p>
        </div>

        {items.length > 0 && (
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-400">
            {items.length}
          </span>
        )}
      </div>

      {!items.length ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-5">
          <p className="text-sm font-medium text-slate-300">
            Aucune activité enregistrée.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Les prochaines analyses, scores ou actions apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="relative border-l border-slate-700 pl-4">
              <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-blue-400" />
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-400">
                    {item.type || "activité"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{formatDate(item.date)}</p>
                {item.description && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
