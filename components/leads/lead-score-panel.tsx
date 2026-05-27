import type { LeadUi } from "@/types/lead-ui";

export function LeadScorePanel({ lead }: { lead: LeadUi }) {
  const hasData =
    lead.globalScore !== null ||
    lead.confidenceScore !== null ||
    Boolean(lead.statusReason);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-lg font-semibold text-white">Score</h2>

      {!hasData ? (
        <p className="mt-4 text-sm text-slate-400">
          Aucun score disponible pour ce lead.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Score commercial</p>
            <p className="mt-1 text-3xl font-semibold text-white">
              {lead.globalScore ?? "—"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Confiance</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {lead.confidenceScore ?? "—"}
            </p>
          </div>

          {lead.statusReason && (
            <p className="rounded-xl bg-slate-950 p-4 text-sm text-slate-300">
              {lead.statusReason}
            </p>
          )}
        </div>
      )}
    </section>
  );
}