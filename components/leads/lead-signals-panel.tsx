import type { LeadUi } from "@/types/lead-ui";

type SignalView = {
  id?: string;
  label: string;
  description?: string | null;
  confidence?: number | null;
  evidence?: string | null;
};

function normalizeSignals(input: unknown[] | undefined): SignalView[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item, index): SignalView | null => {
      if (typeof item === "string") {
        return {
          id: String(index),
          label: item,
        };
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;

      const label =
        typeof record.label === "string"
          ? record.label
          : typeof record.title === "string"
            ? record.title
            : typeof record.name === "string"
              ? record.name
              : `Signal ${index + 1}`;

      const description =
        typeof record.description === "string" ? record.description : null;

      const confidence =
        typeof record.confidence === "number"
          ? record.confidence
          : typeof record.confidenceScore === "number"
            ? record.confidenceScore
            : null;

      const evidence =
        typeof record.evidence === "string"
          ? record.evidence
          : typeof record.source === "string"
            ? record.source
            : null;

      return {
        id: typeof record.id === "string" ? record.id : String(index),
        label,
        description,
        confidence,
        evidence,
      };
    })
    .filter((signal): signal is SignalView => signal !== null);
}

export function LeadSignalsPanel({ lead }: { lead: LeadUi }) {
  const signals = normalizeSignals(lead.weakSignals);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-lg font-semibold text-white">Signaux faibles</h2>

      {!signals.length ? (
        <p className="mt-4 text-sm text-slate-400">
          Aucun signal faible détecté pour le moment.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {signals.map((signal) => (
            <div key={signal.id || signal.label} className="rounded-xl bg-slate-950 p-4">
              <div className="flex items-start justify-between gap-4">
                <p className="font-medium text-white">{signal.label}</p>

                {signal.confidence !== null && signal.confidence !== undefined && (
                  <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-400">
                    {signal.confidence}
                  </span>
                )}
              </div>

              {signal.description && (
                <p className="mt-2 text-sm text-slate-400">{signal.description}</p>
              )}

              {signal.evidence && (
                <p className="mt-3 text-xs text-slate-500">
                  Preuve : {signal.evidence}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}