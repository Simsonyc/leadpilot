import type { LeadUi } from "@/types/lead-ui";

type SignalView = {
  id?: string;
  label: string;
  category?: string | null;
  description?: string | null;
  evidence?: string | null;
  confidence?: number | null;
  weightApplied?: number | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeSignals(input: unknown[] | undefined): SignalView[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item, index): SignalView | null => {
      if (typeof item === "string" && item.trim().length > 0) {
        return {
          id: String(index),
          label: item,
        };
      }

      if (!isRecord(item)) return null;

      const weakSignal = isRecord(item.weakSignal) ? item.weakSignal : null;

      const id = getString(item.id) ?? String(index);

      const label =
        getString(weakSignal?.label) ??
        getString(item.label) ??
        getString(item.title) ??
        getString(item.name) ??
        `Signal ${index + 1}`;

      const category =
        getString(weakSignal?.category) ??
        getString(item.category);

      const description =
        getString(weakSignal?.description) ??
        getString(item.description);

      const evidence =
        getString(item.evidence) ??
        getString(item.value);

      const confidence =
        getNumber(item.confidence) ??
        getNumber(item.confidenceScore);

      const weightApplied =
        getNumber(item.weightApplied) ??
        getNumber(weakSignal?.defaultWeight);

      return {
        id,
        label,
        category,
        description,
        evidence,
        confidence,
        weightApplied,
      };
    })
    .filter((signal): signal is SignalView => signal !== null);
}

export function LeadSignalsPanel({ lead }: { lead: LeadUi }) {
  const signals = normalizeSignals(lead.weakSignals);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Signaux faibles</h2>
          <p className="mt-1 text-sm text-slate-400">
            Indices détectés sur la présence digitale du lead.
          </p>
        </div>

        {signals.length > 0 && (
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-400">
            {signals.length} signal{signals.length > 1 ? "aux" : ""}
          </span>
        )}
      </div>

      {!signals.length ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-5">
          <p className="text-sm font-medium text-slate-300">
            Aucun signal faible détecté pour le moment.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Lance une analyse pour enrichir la fiche lead.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {signals.map((signal) => (
            <div
              key={signal.id ?? signal.label}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">{signal.label}</p>

                    {signal.category && (
                      <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-400">
                        {signal.category}
                      </span>
                    )}
                  </div>

                  {signal.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {signal.description}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {typeof signal.confidence === "number" && (
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-300">
                      {signal.confidence}/100
                    </span>
                  )}

                  {typeof signal.weightApplied === "number" && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                      poids {signal.weightApplied}
                    </span>
                  )}
                </div>
              </div>

              {signal.evidence && (
                <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Preuve
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {signal.evidence}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}