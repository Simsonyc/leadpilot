"use client";

import { useState } from "react";
import Link from "next/link";
import type { LeadUi } from "@/types/lead-ui";

type Props = {
  lead: LeadUi;
  onArchive: () => void;
  archiving: boolean;
};

const TEMPERATURE_CONFIG: Record<string, { label: string; color: string }> = {
  HOT: { label: "Chaud", color: "bg-red-500/15 text-red-400 border-red-500/30" },
  WARM: { label: "Tiède", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  COLD: { label: "Froid", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NEW: { label: "Nouveau", color: "bg-slate-800 text-slate-300 border-slate-700" },
  TO_QUALIFY: { label: "À qualifier", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  QUALIFIED: { label: "Qualifié", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  CONTACTED: { label: "Contacté", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  IN_PROGRESS: { label: "En cours", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  WON: { label: "Gagné", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  LOST: { label: "Perdu", color: "bg-red-500/15 text-red-400 border-red-500/30" },
  ARCHIVED: { label: "Archivé", color: "bg-slate-700/50 text-slate-500 border-slate-700" },
};

function getBadge(map: Record<string, { label: string; color: string }>, key?: string | null) {
  const upper = (key ?? "").toUpperCase();
  return map[upper] ?? { label: key ?? "—", color: "bg-slate-800 text-slate-400 border-slate-700" };
}

export function LeadDetailHeader({ lead, onArchive, archiving }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const tempBadge = getBadge(TEMPERATURE_CONFIG, lead.temperature);
  const statusBadge = getBadge(STATUS_CONFIG, lead.status);

  async function handleSaveHeader(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(event.currentTarget);

    const payload = {
      name: String(form.get("name") || "").trim() || undefined,
      contactName: String(form.get("contactName") || "").trim() || null,
      email: String(form.get("email") || "").trim() || null,
      phone: String(form.get("phone") || "").trim() || null,
      website: String(form.get("website") || "").trim() || null,
      sector: String(form.get("sector") || "").trim() || null,
      city: String(form.get("city") || "").trim() || null,
    };

    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: unknown = await response.json();

      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("success" in result) ||
        result.success !== true
      ) {
        throw new Error("Mise à jour impossible.");
      }

      setEditing(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      {/* Navigation */}
      <Link
        href="/leads"
        className="text-sm text-blue-400 transition-colors hover:text-blue-300"
      >
        ← Retour leads
      </Link>

      {!editing ? (
        /* ── Vue normale ── */
        <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold text-white">
              {lead.name || "Lead sans nom"}
            </h1>

            {lead.contactName && (
              <p className="mt-1 text-sm text-slate-400">{lead.contactName}</p>
            )}

            {/* Badges */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tempBadge.color}`}>
                {tempBadge.label}
              </span>
              {lead.pipelineStage && (
                <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  {lead.pipelineStage}
                </span>
              )}
              {lead.city && (
                <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  {lead.city}
                </span>
              )}
              {lead.sector && (
                <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  {lead.sector}
                </span>
              )}
              {lead.globalScore !== null && lead.globalScore !== undefined && (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  Score {lead.globalScore}/100
                </span>
              )}
            </div>

            {/* Coordonnées */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-1.5 transition-colors hover:text-blue-400"
                >
                  ✉ {lead.email}
                </a>
              )}
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-1.5 transition-colors hover:text-blue-400"
                >
                  ☎ {lead.phone}
                </a>
              )}
              {lead.website && (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 transition-colors hover:text-blue-400"
                >
                  🌐 {lead.website}
                </a>
              )}
            </div>

            {/* Tags */}
            {(lead.tags ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(lead.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-xs text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-2.5 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/20"
            >
              Modifier la fiche
            </button>
            <button
              type="button"
              onClick={onArchive}
              disabled={archiving}
              className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {archiving ? "Archivage..." : "Archiver"}
            </button>
          </div>
        </div>
      ) : (
        /* ── Mode édition ── */
        <form onSubmit={handleSaveHeader} className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                Nom / entreprise
              </label>
              <input
                name="name"
                defaultValue={lead.name ?? ""}
                required
                disabled={saving}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                Nom du contact
              </label>
              <input
                name="contactName"
                defaultValue={lead.contactName ?? ""}
                disabled={saving}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                Email
              </label>
              <input
                name="email"
                type="email"
                defaultValue={lead.email ?? ""}
                disabled={saving}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                Téléphone
              </label>
              <input
                name="phone"
                type="tel"
                defaultValue={lead.phone ?? ""}
                disabled={saving}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                Site web
              </label>
              <input
                name="website"
                type="url"
                defaultValue={lead.website ?? ""}
                disabled={saving}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                Secteur
              </label>
              <input
                name="sector"
                defaultValue={lead.sector ?? ""}
                disabled={saving}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                Ville
              </label>
              <input
                name="city"
                defaultValue={lead.city ?? ""}
                disabled={saving}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => { setEditing(false); setError(""); }}
              className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
