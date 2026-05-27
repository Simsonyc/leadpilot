"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LeadDetailHeader } from "@/components/leads/lead-detail-header";
import { LeadScorePanel } from "@/components/leads/lead-score-panel";
import { LeadSignalsPanel } from "@/components/leads/lead-signals-panel";
import { LeadAiPanel } from "@/components/leads/lead-ai-panel";
import { LeadEventsPanel } from "@/components/leads/lead-events-panel";
import type { LeadUi } from "@/types/lead-ui";

type LeadAction = "idle" | "analyze" | "score" | "refresh";

function toDateTimeLocal(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [lead, setLead] = useState<LeadUi | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [actionLoading, setActionLoading] = useState<LeadAction>("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saved, setSaved] = useState(false);

  async function loadLead(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(`/api/leads/${params.id}`, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error("Impossible de charger ce lead.");
      }

      setLead(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (params.id) {
      void loadLead();
    }
  }, [params.id]);

  async function runLeadAction(action: Exclude<LeadAction, "idle">) {
    if (!lead || actionLoading !== "idle") return;

    setActionLoading(action);
    setError("");
    setSuccess("");
    setSaved(false);

    try {
      if (action === "refresh") {
        await loadLead({ silent: true });
        setSuccess("Fiche lead rafraîchie.");
        return;
      }

      const endpoint =
        action === "analyze"
          ? `/api/leads/${lead.id}/analyze-signals`
          : `/api/leads/${lead.id}/score`;

      const response = await fetch(endpoint, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          action === "analyze"
            ? "Analyse des signaux impossible."
            : "Recalcul du score impossible.",
        );
      }

      await loadLead({ silent: true });

      setSuccess(
        action === "analyze"
          ? "Signaux analysés et fiche mise à jour."
          : "Score recalculé et fiche mise à jour.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setActionLoading("idle");
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead) return;

    setSaving(true);
    setSaved(false);
    setSuccess("");
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
    setSuccess("");

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

  const isActionRunning = actionLoading !== "idle";

  return (
    <AppShell>
      {loading && (
        <p className="text-sm text-slate-400">Chargement du lead...</p>
      )}

      {!loading && lead && (
        <div className="space-y-6">
          <LeadDetailHeader
            lead={lead}
            onArchive={handleArchive}
            archiving={archiving}
          />

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Actions cockpit
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Analyse digitale, scoring commercial et rafraîchissement de la fiche.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={isActionRunning}
                  onClick={() => void runLeadAction("analyze")}
                  className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-300 hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "analyze"
                    ? "Analyse..."
                    : "Analyser les signaux"}
                </button>

                <button
                  type="button"
                  disabled={isActionRunning}
                  onClick={() => void runLeadAction("score")}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "score"
                    ? "Recalcul..."
                    : "Recalculer le score"}
                </button>

                <button
                  type="button"
                  disabled={isActionRunning}
                  onClick={() => void runLeadAction("refresh")}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "refresh"
                    ? "Rafraîchissement..."
                    : "Rafraîchir"}
                </button>
              </div>
            </div>

            {(success || error) && (
              <div className="mt-4">
                {success && (
                  <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                    {success}
                  </p>
                )}

                {error && (
                  <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </p>
                )}
              </div>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <form
              onSubmit={handleSave}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <h2 className="text-lg font-semibold text-white">
                Édition rapide
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <select
                  name="status"
                  defaultValue={lead.status || "new"}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm"
                >
                  <option value="new">Nouveau</option>
                  <option value="to_qualify">À qualifier</option>
                  <option value="qualified">Qualifié</option>
                  <option value="contacted">Contacté</option>
                  <option value="archived">Archivé</option>
                </select>

                <select
                  name="temperature"
                  defaultValue={lead.temperature || "cold"}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm"
                >
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

                {saved && (
                  <p className="text-sm text-emerald-400">
                    Modifications enregistrées.
                  </p>
                )}
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