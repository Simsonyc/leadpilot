import type { LeadUi } from "@/types/lead-ui";

export function LeadEventsPanel({ lead }: { lead: LeadUi }) {
  const events = lead.events || [];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-lg font-semibold text-white">Événements</h2>

      {!events.length ? (
        <p className="mt-4 text-sm text-slate-400">
          Aucun événement enregistré.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {events.map((event, index) => (
            <div key={index} className="rounded-xl bg-slate-950 p-4">
              <p className="text-sm text-slate-300">
                {typeof event === "string" ? event : JSON.stringify(event)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}