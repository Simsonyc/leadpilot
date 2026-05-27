"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LeadDetailHeader } from "@/components/leads/lead-detail-header";
import { LeadScorePanel } from "@/components/leads/lead-score-panel";
import { LeadSignalsPanel } from "@/components/leads/lead-signals-panel";
import { LeadAiPanel } from "@/components/leads/lead-ai-panel";
import { LeadEventsPanel } from "@/components/leads/lead-events-panel";

type Lead = {
  id: string;
  name?: string | null;
  status?: string | null;
  temperature?: string | null;
  city?: string | null;
  sector?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  nextActionAt?: string | null;
  statusReason?: string | null;
  confidenceScore?: number | null;
  score?: number | null;
  isArchived?: boolean | null;
  weakSignals?: unknown[];
  signals?: unknown[];
  aiOutputs?: unknown[];
  leadAiOutputs?: unknown[];
  events?: unknown[];
  leadEvents?: unknown[];
};

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function loadLead() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/leads/${params.id}`, { cache: "no-store" });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error("Impossible de charger ce lead.");
      }

      setLead(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) loadLead();
  }, [params.id]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead) return;

    setSaving(true);
    setSaved(false);
    setError("");

    const form = new FormData(event.currentTarget);

    const payload = {
      status: String(form.get("status") || ""),
      temperature: String(form.get("temperature") || ""),
      notes: String(form.get("notes") || ""),
      tags: String(form.get("tags") || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      nextActionAt: form.get("nextActionAt")
        ? new Date(String(form.get("nextActionAt"))).toISOString()
        : null,
      statusReason: String(form.get("statusReason") || ""),
      confidenceScore: form.get("confidenceScore")
        ? Number(form.get("confidenceScore"))
        : null,
    };

    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error("Mise à jour impossible.");
      }

      setLead(result.data);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!lead) return;

    setArchiving(true);
    setError("");

    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error("Archivage impossible.");
      }

      router.push("/leads");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setArchiving(false);
    }
  }

  return (
    <AppShell>
      {loading && <p className="text-sm text-slate-400">Chargement du lead...</p>}
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {!loading && lead && (
        <div className="space-y-6">
          <LeadDetailHeader lead={lead} onArchive={handleArchive} archiving={archiving} />

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <form onSubmit={handleSave} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold text-white">Édition rapide</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <select name="status" defaultValue={lead.status || "new"} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm">
                  <option value="new">Nouveau</option>
                  <option value="to_qualify">À qualifier</option>
                  <option value="qualified">Qualifié</option>
                  <option value="contacted">Contacté</option>
                  <option value="archived">Archivé</option>
                </select>

                <select name="temperature" defaultValue={lead.temperature || "cold"} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm">
                  <option value="cold">Froid</option>
                  <option value="warm">Tiède</option>
                  <option value="hot">Chaud</option>
                </select>

                <input
                  name="nextActionAt"
                  type="datetime-local"
                  defaultValue={toDateTimeLocal(lead.nextActionAt)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm"
                />

                <input
                  name="confidenceScore"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={lead.confidenceScore ?? ""}
                  placeholder="Confidence score"
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm"
                />

                <input
                  name="tags"
                  defaultValue={(lead.tags || []).join(", ")}
                  placeholder="Tags"
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm md:col-span-2"
                />

                <textarea
                  name="statusReason"
                  defaultValue={lead.statusReason || ""}
                  placeholder="Raison du statut"
                  rows={3}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm md:col-span-2"
                />

                <textarea
                  name="notes"
                  defaultValue={lead.notes || ""}
                  placeholder="Notes"
                  rows={6}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm md:col-span-2"
                />
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>

                {saved && <p className="text-sm text-emerald-400">Modifications enregistrées.</p>}
              </div>
            </form>

            <LeadScorePanel lead={lead} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <LeadSignalsPanel lead={lead} />
            <LeadAiPanel lead={lead} />
            <LeadEventsPanel lead={lead} />
          </div>
        </div>
      )}
    </AppShell>
  );
}