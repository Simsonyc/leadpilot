"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LeadDetailHeader } from "@/components/leads/lead-detail-header";
import { LeadScorePanel } from "@/components/leads/lead-score-panel";
import { LeadSignalsPanel } from "@/components/leads/lead-signals-panel";
import { LeadAiPanelFull } from "@/components/leads/lead-ai-panel";
import { LeadEventsPanel } from "@/components/leads/lead-events-panel";
import { LeadNextActionsPanel } from "@/components/leads/lead-next-actions-panel";
import type { LeadUi } from "@/types/lead-ui";

type LeadAction = "idle" | "analyze" | "score" | "approach" | "refresh" | "ghl" | "deep";
type ToastKind = "success" | "error";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

function toDateTimeLocal(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function LeadDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
        <div className="mt-4 h-9 w-72 animate-pulse rounded bg-slate-800" />
        <div className="mt-4 flex gap-2">
          <div className="h-8 w-24 animate-pulse rounded-full bg-slate-800" />
          <div className="h-8 w-24 animate-pulse rounded-full bg-slate-800" />
          <div className="h-8 w-24 animate-pulse rounded-full bg-slate-800" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="h-96 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
        <div className="h-96 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
        <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-56 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
        <div className="h-56 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
        <div className="h-56 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
      </div>
    </div>
  );
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
  const [toast, setToast] = useState<Toast | null>(null);

  function showToast(kind: ToastKind, message: string) {
    setToast({ id: Date.now(), kind, message });
  }

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const loadLead = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/leads/${params.id}`, {
          cache: "no-store",
        });

        const result: unknown = await response.json();

        if (
          !response.ok ||
          typeof result !== "object" ||
          result === null ||
          !("success" in result) ||
          result.success !== true ||
          !("data" in result)
        ) {
          throw new Error("Impossible de charger ce lead.");
        }

        setLead(result.data as LeadUi);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue.";
        setError(message);
        showToast("error", message);
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [params.id],
  );

  useEffect(() => {
    if (params.id) void loadLead();
  }, [params.id, loadLead]);

  // Callback pour les next actions — refresh silencieux
  const handleRefresh = useCallback(async () => {
    await loadLead({ silent: true });
  }, [loadLead]);

  async function runLeadAction(action: Exclude<LeadAction, "idle">) {
    if (!lead || actionLoading !== "idle") return;

    setActionLoading(action);
    setError("");

    try {
      if (action === "refresh") {
        await loadLead({ silent: true });
        showToast("success", "Fiche lead rafraîchie.");
        return;
      }

      const endpoint =
        action === "analyze"
          ? `/api/leads/${lead.id}/analyze-signals`
          : action === "score"
            ? `/api/leads/${lead.id}/score`
            : action === "ghl"
              ? `/api/leads/${lead.id}/ghl-sync`
              : action === "deep"
                ? `/api/leads/${lead.id}/analyze-deep`
                : `/api/leads/${lead.id}/generate-approach`;

      const response = await fetch(endpoint, { method: "POST" });
      const result: unknown = await response.json();

      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("success" in result) ||
        result.success !== true
      ) {
        throw new Error(
          action === "analyze"
            ? "Analyse des signaux impossible."
            : action === "score"
              ? "Recalcul du score impossible."
              : "Génération de l'approche commerciale impossible.",
        );
      }

      await loadLead({ silent: true });

      showToast(
        "success",
        action === "analyze"
          ? "Signaux analysés et fiche mise à jour."
          : action === "score"
            ? "Score recalculé et fiche mise à jour."
            : action === "ghl"
              ? "Lead synchronisé dans GoHighLevel."
              : action === "deep"
                ? "Analyse approfondie terminée."
                : "Approche commerciale générée et enregistrée.",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue.";
      setError(message);
      showToast("error", message);
    } finally {
      setActionLoading("idle");
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead) return;

    setSaving(true);
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

      await loadLead({ silent: true });
      showToast("success", "Modifications enregistrées.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue.";
      setError(message);
      showToast("error", message);
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

      const result: unknown = await response.json();

      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("success" in result) ||
        result.success !== true
      ) {
        throw new Error("Archivage impossible.");
      }

      router.push("/leads");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue.";
      setError(message);
      showToast("error", message);
    } finally {
      setArchiving(false);
    }
  }

  const isActionRunning = actionLoading !== "idle";

  return (
    <AppShell>
      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-4 z-50 max-w-sm">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm shadow-lg ${
              toast.kind === "success"
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                : "border-red-500/30 bg-red-500/15 text-red-200"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {loading && <LeadDetailSkeleton />}

      {!loading && error && !lead && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && lead && (
        <div className="space-y-6">
          {/* Header */}
          <LeadDetailHeader
            lead={lead}
            onArchive={handleArchive}
            archiving={archiving}
          />

          {/* Actions cockpit */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Actions cockpit
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Analyse digitale, scoring commercial, approche IA et
                  rafraîchissement.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={isActionRunning}
                  onClick={() => void runLeadAction("analyze")}
                  className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "analyze"
                    ? "Analyse..."
                    : "Analyser les signaux"}
                </button>

                <button
                  type="button"
                  disabled={isActionRunning}
                  onClick={() => void runLeadAction("score")}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "score"
                    ? "Recalcul..."
                    : "Recalculer le score"}
                </button>

                <button
                  type="button"
                  disabled={isActionRunning}
                  onClick={() => void runLeadAction("approach")}
                  className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm font-semibold text-purple-300 transition-colors hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "approach"
                    ? "Génération..."
                    : "Générer approche commerciale"}
                </button>

                <button
                  type="button"
                  disabled={isActionRunning}
                  onClick={() => void runLeadAction("deep")}
                  className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm font-semibold text-orange-300 transition-colors hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "deep"
                    ? "Analyse en cours..."
                    : "Analyse approfondie"}
                </button>

                <button
                  type="button"
                  disabled={isActionRunning}
                  onClick={() => void runLeadAction("ghl")}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "ghl"
                    ? "Sync GHL..."
                    : "Synchroniser GHL"}
                </button>

                <button
                  type="button"
                  disabled={isActionRunning}
                  onClick={() => void runLeadAction("refresh")}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "refresh"
                    ? "Rafraîchissement..."
                    : "Rafraîchir"}
                </button>
              </div>
            </div>
          </section>

          {/* Édition rapide + Score */}
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
                  defaultValue={lead.status ?? "NEW"}
                  disabled={saving}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white disabled:opacity-50"
                >
                  <option value="NEW">Nouveau</option>
                  <option value="TO_QUALIFY">À qualifier</option>
                  <option value="QUALIFIED">Qualifié</option>
                  <option value="CONTACTED">Contacté</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="WON">Gagné</option>
                  <option value="LOST">Perdu</option>
                  <option value="ARCHIVED">Archivé</option>
                </select>

                <select
                  name="temperature"
                  defaultValue={lead.temperature ?? "COLD"}
                  disabled={saving}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white disabled:opacity-50"
                >
                  <option value="COLD">Froid</option>
                  <option value="WARM">Tiède</option>
                  <option value="HOT">Chaud</option>
                </select>

                <input
                  name="nextActionAt"
                  type="datetime-local"
                  defaultValue={toDateTimeLocal(lead.nextActionAt)}
                  disabled={saving}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white disabled:opacity-50"
                />

                <input
                  name="confidenceScore"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={lead.confidenceScore ?? ""}
                  placeholder="Confidence score"
                  disabled={saving}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white disabled:opacity-50"
                />

                <input
                  name="tags"
                  defaultValue={(lead.tags ?? []).join(", ")}
                  placeholder="Tags"
                  disabled={saving}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white disabled:opacity-50 md:col-span-2"
                />

                <textarea
                  name="statusReason"
                  defaultValue={lead.statusReason ?? ""}
                  placeholder="Raison du statut"
                  rows={3}
                  disabled={saving}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white disabled:opacity-50 md:col-span-2"
                />

                <textarea
                  name="notes"
                  defaultValue={lead.notes ?? ""}
                  placeholder="Notes"
                  rows={6}
                  disabled={saving}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white disabled:opacity-50 md:col-span-2"
                />
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>

            <LeadScorePanel lead={lead} />
          </div>

          {/* Next actions + Signals + AI */}
          <div className="grid gap-6 lg:grid-cols-2">
            <LeadNextActionsPanel
              leadId={lead.id}
              nextActions={lead.nextActions ?? []}
              onRefresh={handleRefresh}
            />
            <LeadSignalsPanel lead={lead} />
          </div>

          {/* AI panel + Timeline */}
          <div className="grid gap-6 lg:grid-cols-2">
            <LeadAiPanelFull lead={lead} />
            <LeadEventsPanel lead={lead} />
          </div>
        </div>
      )}
    </AppShell>
  );
}
