"use client";

import { FormEvent, useState } from "react";
import type { LeadNextActionUi } from "@/types/lead-ui";

// ── Helpers ────────────────────────────────────────────────────

function formatDate(value?: string | Date | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isOverdue(dueAt?: string | Date | null, completed?: boolean | null): boolean {
  if (!dueAt || completed) return false;
  return new Date(dueAt).getTime() < Date.now();
}

// ── Config priorité ────────────────────────────────────────────

type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; border: string; text: string }
> = {
  LOW: {
    label: "Faible",
    border: "border-slate-600",
    text: "text-slate-400",
  },
  MEDIUM: {
    label: "Normale",
    border: "border-blue-500/30",
    text: "text-blue-400",
  },
  HIGH: {
    label: "Haute",
    border: "border-amber-500/30",
    text: "text-amber-400",
  },
  URGENT: {
    label: "Urgente",
    border: "border-red-500/30",
    text: "text-red-400",
  },
};

function getPriorityConfig(priority?: Priority | null) {
  return PRIORITY_CONFIG[priority ?? "MEDIUM"];
}

// ── Props ──────────────────────────────────────────────────────

type LeadNextActionsPanelProps = {
  leadId: string;
  nextActions: LeadNextActionUi[];
  onRefresh: () => Promise<void>;
};

// ── Composant ──────────────────────────────────────────────────

export function LeadNextActionsPanel({
  leadId,
  nextActions,
  onRefresh,
}: LeadNextActionsPanelProps) {
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = nextActions.filter((a) => !a.completed);
  const completed = nextActions.filter((a) => a.completed);

  // ── Créer ────────────────────────────────────────────────────

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const label = String(form.get("label") ?? "").trim();
    const priority = String(form.get("priority") ?? "MEDIUM");
    const dueAtRaw = String(form.get("dueAt") ?? "");

    if (!label) {
      setError("Le libellé est requis.");
      setCreating(false);
      return;
    }

    try {
      const response = await fetch(`/api/leads/${leadId}/next-actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          priority,
          dueAt: dueAtRaw ? new Date(dueAtRaw).toISOString() : null,
        }),
      });

      const result: unknown = await response.json();

      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("success" in result) ||
        result.success !== true
      ) {
        throw new Error("Impossible de créer l'action.");
      }

      (event.target as HTMLFormElement).reset();
      setShowForm(false);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setCreating(false);
    }
  }

  // ── Terminer / rouvrir ───────────────────────────────────────

  async function handleToggle(action: LeadNextActionUi) {
    setLoadingId(action.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/leads/${leadId}/next-actions/${action.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: !action.completed }),
        },
      );

      const result: unknown = await response.json();

      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("success" in result) ||
        result.success !== true
      ) {
        throw new Error("Impossible de mettre à jour l'action.");
      }

      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoadingId(null);
    }
  }

  // ── Supprimer ────────────────────────────────────────────────

  async function handleDelete(action: LeadNextActionUi) {
    setLoadingId(action.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/leads/${leadId}/next-actions/${action.id}`,
        { method: "DELETE" },
      );

      const result: unknown = await response.json();

      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("success" in result) ||
        result.success !== true
      ) {
        throw new Error("Impossible de supprimer l'action.");
      }

      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoadingId(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Prochaines actions
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Relances, RDV et tâches commerciales.
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {pending.length > 0 && (
            <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-400">
              {pending.length}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setShowForm((v) => !v);
              setError(null);
            }}
            className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/20"
          >
            {showForm ? "Annuler" : "+ Action"}
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-4 space-y-3 rounded-xl border border-slate-700 bg-slate-950 p-4"
        >
          <input
            name="label"
            type="text"
            placeholder="Libellé de l'action..."
            disabled={creating}
            required
            autoFocus
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 disabled:opacity-50"
          />

          <div className="flex gap-3">
            <select
              name="priority"
              defaultValue="MEDIUM"
              disabled={creating}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 disabled:opacity-50"
            >
              <option value="LOW">Faible</option>
              <option value="MEDIUM">Normale</option>
              <option value="HIGH">Haute</option>
              <option value="URGENT">Urgente</option>
            </select>

            <input
              name="dueAt"
              type="datetime-local"
              disabled={creating}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Création..." : "Créer l'action"}
          </button>
        </form>
      )}

      {/* Empty state */}
      {nextActions.length === 0 && !showForm && (
        <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-5">
          <p className="text-sm font-medium text-slate-300">
            Aucune action planifiée.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Ajoutez une relance, un RDV ou une tâche commerciale.
          </p>
        </div>
      )}

      {/* Actions en attente */}
      {pending.length > 0 && (
        <div className="mt-5 space-y-2">
          {pending.map((action) => {
            const config = getPriorityConfig(action.priority);
            const overdue = isOverdue(action.dueAt, action.completed);
            const isLoading = loadingId === action.id;
            const label = action.label ?? "";

            return (
              <div
                key={action.id}
                className={`rounded-xl border p-4 transition-opacity ${
                  overdue
                    ? "border-red-500/25 bg-red-500/5"
                    : "border-slate-800 bg-slate-950"
                } ${isLoading ? "opacity-50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {/* Toggle */}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => void handleToggle(action)}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border border-slate-600 bg-slate-900 transition-colors hover:border-emerald-500 disabled:cursor-not-allowed"
                    aria-label="Marquer comme terminée"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{label}</p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${config.border} ${config.text}`}
                      >
                        {config.label}
                      </span>

                      {action.dueAt && (
                        <span
                          className={`text-[11px] ${
                            overdue
                              ? "font-semibold text-red-400"
                              : "text-slate-500"
                          }`}
                        >
                          {overdue ? "En retard · " : ""}
                          {formatDate(action.dueAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Supprimer */}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => void handleDelete(action)}
                    className="flex-shrink-0 rounded-lg p-1 text-slate-600 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed"
                    aria-label="Supprimer l'action"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3,6 5,6 21,6" />
                      <path d="m19,6-.867,12.142A2,2,0,0,1,16.138,20H7.862a2,2,0,0,1-1.995-1.858L5,6" />
                      <path d="M10,11v6M14,11v6" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions terminées */}
      {completed.length > 0 && (
        <details className="group mt-4">
          <summary className="flex cursor-pointer select-none items-center gap-2 text-xs text-slate-500 transition-colors hover:text-slate-400 [list-style:none]">
            <span className="inline-block transition-transform group-open:rotate-90">
              ▶
            </span>
            {completed.length} action{completed.length > 1 ? "s" : ""} terminée
            {completed.length > 1 ? "s" : ""}
          </summary>

          <div className="mt-2 space-y-2">
            {completed.map((action) => {
              const isLoading = loadingId === action.id;
              const label = action.label ?? "";

              return (
                <div
                  key={action.id}
                  className={`rounded-xl border border-slate-800/60 bg-slate-950/40 p-3.5 transition-opacity ${
                    isLoading ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox cochée */}
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => void handleToggle(action)}
                      className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 transition-colors hover:border-slate-600 hover:bg-slate-900 disabled:cursor-not-allowed"
                      aria-label="Rouvrir l'action"
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    </button>

                    <p className="flex-1 text-sm text-slate-500 line-through">
                      {label}
                    </p>

                    {/* Supprimer */}
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => void handleDelete(action)}
                      className="flex-shrink-0 rounded-lg p-1 text-slate-700 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed"
                      aria-label="Supprimer l'action"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3,6 5,6 21,6" />
                        <path d="m19,6-.867,12.142A2,2,0,0,1,16.138,20H7.862a2,2,0,0,1-1.995-1.858L5,6" />
                      </svg>
                    </button>
                  </div>

                  {action.completedAt && (
                    <p className="mt-1 pl-7 text-[10px] text-slate-600">
                      Terminée le {formatDate(action.completedAt)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </details>
      )}
    </section>
  );
}
