"use client";

import Link from "next/link";
import type { LeadUi } from "@/types/lead-ui";

type LeadsTableProps = {
  leads: LeadUi[];
  selectedIds: Set<string>;
  onToggleSelected: (id: string) => void;
  onToggleAll: () => void;
};

function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR").format(date);
}

function badgeClass(value?: string | null) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "hot") return "border-red-500/30 bg-red-500/15 text-red-300";
  if (normalized === "warm") return "border-amber-500/30 bg-amber-500/15 text-amber-300";
  if (normalized === "cold") return "border-blue-500/30 bg-blue-500/15 text-blue-300";
  return "border-slate-700 bg-slate-800 text-slate-300";
}

function getScore(lead: LeadUi) {
  return lead.globalScore ?? lead.score ?? null;
}

export function LeadsTable({
  leads,
  selectedIds,
  onToggleSelected,
  onToggleAll,
}: LeadsTableProps) {
  const allSelected = leads.length > 0 && leads.every((lead) => selectedIds.has(lead.id));

  if (!leads.length) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <p className="text-sm font-medium text-white">Aucun lead trouvé.</p>
        <p className="mt-1 text-sm text-slate-400">
          Crée un lead manuel ou ajuste tes filtres.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-4 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                  aria-label="Sélectionner tous les leads"
                />
              </th>
              <th className="px-4 py-4 text-left">Nom</th>
              <th className="px-4 py-4 text-left">Secteur</th>
              <th className="px-4 py-4 text-left">Ville</th>
              <th className="px-4 py-4 text-left">Source</th>
              <th className="px-4 py-4 text-left">Statut</th>
              <th className="px-4 py-4 text-left">Temp.</th>
              <th className="px-4 py-4 text-left">Score</th>
              <th className="px-4 py-4 text-left">Prochaine action</th>
              <th className="px-4 py-4 text-left">Tags</th>
              <th className="px-4 py-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {leads.map((lead) => {
              const score = getScore(lead);

              return (
                <tr key={lead.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(lead.id)}
                      onChange={() => onToggleSelected(lead.id)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                      aria-label={`Sélectionner ${lead.name || "ce lead"}`}
                    />
                  </td>
                  <td className="px-4 py-4 font-medium text-white">
                    {lead.name || "Sans nom"}
                  </td>
                  <td className="px-4 py-4 text-slate-300">
                    {lead.sector || lead.verticale || lead.vertical || "—"}
                  </td>
                  <td className="px-4 py-4 text-slate-300">{lead.city || "—"}</td>
                  <td className="px-4 py-4 text-slate-300">{lead.sourceChannel || "—"}</td>
                  <td className="px-4 py-4 text-slate-300">
                    {lead.isArchived ? "archived" : lead.status || "—"}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full border px-3 py-1 text-xs ${badgeClass(lead.temperature)}`}>
                      {lead.temperature || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{score ?? "—"}</td>
                  <td className="px-4 py-4 text-slate-300">{formatDate(lead.nextActionAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(lead.tags || []).slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link href={`/leads/${lead.id}`} className="text-sm font-medium text-blue-400 hover:text-blue-300">
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
