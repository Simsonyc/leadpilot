import Link from "next/link";
import type { LeadUi } from "@/types/lead-ui";

type Props = {
  lead: LeadUi;
  onArchive: () => void;
  archiving: boolean;
};

export function LeadDetailHeader({ lead, onArchive, archiving }: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <Link href="/leads" className="text-sm text-blue-400 hover:text-blue-300">
            ← Retour leads
          </Link>

          <h1 className="mt-4 text-3xl font-semibold text-white">
            {lead.name || "Lead sans nom"}
          </h1>

          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
              {lead.status || "statut inconnu"}
            </span>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
              {lead.temperature || "température inconnue"}
            </span>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
              {lead.city || "ville inconnue"}
            </span>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
              {lead.sector || "secteur inconnu"}
            </span>
          </div>
        </div>

        <button
          onClick={onArchive}
          disabled={archiving}
          className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        >
          {archiving ? "Archivage..." : "Archiver"}
        </button>
      </div>
    </div>
  );
}