import type { LeadUi } from "@/types/lead-ui";

export function LeadAiPanel({ lead }: { lead: LeadUi }) {
  const outputs = lead.aiOutputs || [];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-lg font-semibold text-white">IA</h2>

      {!outputs.length ? (
        <p className="mt-4 text-sm text-slate-400">
          Aucun contenu IA généré pour ce lead.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {outputs.map((output, index) => (
            <div key={index} className="rounded-xl bg-slate-950 p-4">
              <p className="whitespace-pre-wrap text-sm text-slate-300">
                {typeof output === "string" ? output : JSON.stringify(output)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}