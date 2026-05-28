"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { LeadForm } from "@/components/leads/lead-form";
import { LeadsTable } from "@/components/leads/leads-table";
import type { LeadUi } from "@/types/lead-ui";

type ViewMode = "table" | "pipeline";
type BulkAction = "archive" | "to_qualify" | "contacted";
type ToastKind = "success" | "error";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

type Filters = {
  query: string;
  status: string;
  temperature: string;
  sourceChannel: string;
  city: string;
  verticale: string;
  minScore: string;
  tag: string;
};

const emptyFilters: Filters = {
  query: "",
  status: "",
  temperature: "",
  sourceChannel: "",
  city: "",
  verticale: "",
  minScore: "",
  tag: "",
};

const pipelineStatuses = ["new", "to_qualify", "qualified", "contacted", "archived"];

function getScore(lead: LeadUi) {
  return lead.globalScore ?? lead.score ?? null;
}

function getVerticale(lead: LeadUi) {
  return lead.verticale ?? lead.vertical ?? lead.sector ?? null;
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

function normalize(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function LeadsSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_0.8fr]">
            <div className="h-10 animate-pulse rounded-xl bg-slate-800" />
            <div className="h-10 animate-pulse rounded-xl bg-slate-800" />
            <div className="h-10 animate-pulse rounded-xl bg-slate-800" />
            <div className="h-10 animate-pulse rounded-xl bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadUi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<BulkAction | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  function showToast(kind: ToastKind, message: string) {
    setToast({ id: Date.now(), kind, message });
  }

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function loadLeads(options?: { silent?: boolean }) {
    if (options?.silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/leads", { cache: "no-store" });
      const result: unknown = await response.json();

      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("success" in result) ||
        result.success !== true ||
        !("data" in result)
      ) {
        throw new Error("Impossible de charger les leads.");
      }

      const data = Array.isArray(result.data) ? (result.data as LeadUi[]) : [];
      setLeads(data);
      setSelectedIds((current) => {
        const existingIds = new Set(data.map((lead) => lead.id));
        return new Set(Array.from(current).filter((id) => existingIds.has(id)));
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue.";
      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    const minScore = filters.minScore ? Number(filters.minScore) : null;
    const search = normalize(filters.query);
    const tagSearch = normalize(filters.tag);

    return leads.filter((lead) => {
      const leadStatus = lead.isArchived ? "archived" : normalize(lead.status);
      const leadScore = getScore(lead);
      const tags = lead.tags || [];
      const searchable = [
        lead.name,
        lead.sector,
        lead.verticale,
        lead.vertical,
        lead.city,
        lead.sourceChannel,
        lead.status,
        lead.temperature,
        lead.notes,
        ...tags,
      ]
        .map((value) => String(value || ""))
        .join(" ")
        .toLowerCase();

      return (
        (!search || searchable.includes(search)) &&
        (!filters.status || leadStatus === normalize(filters.status)) &&
        (!filters.temperature || normalize(lead.temperature) === normalize(filters.temperature)) &&
        (!filters.sourceChannel || normalize(lead.sourceChannel) === normalize(filters.sourceChannel)) &&
        (!filters.city || normalize(lead.city) === normalize(filters.city)) &&
        (!filters.verticale || normalize(getVerticale(lead)) === normalize(filters.verticale)) &&
        (minScore === null || (typeof leadScore === "number" && leadScore >= minScore)) &&
        (!tagSearch || tags.some((tag) => normalize(tag).includes(tagSearch)))
      );
    });
  }, [leads, filters]);

  const sourceChannels = uniqueValues(leads.map((lead) => lead.sourceChannel));
  const cities = uniqueValues(leads.map((lead) => lead.city));
  const verticales = uniqueValues(leads.map((lead) => getVerticale(lead)));
  const tags = uniqueValues(leads.flatMap((lead) => lead.tags || []));

  const kpis = {
    total: leads.length,
    hot: leads.filter((lead) => normalize(lead.temperature) === "hot").length,
    toQualify: leads.filter((lead) => normalize(lead.status) === "to_qualify").length,
    archived: leads.filter((lead) => lead.isArchived || normalize(lead.status) === "archived").length,
  };

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((current) => {
      const visibleIds = filteredLeads.map((lead) => lead.id);
      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => current.has(id));
      if (allSelected) {
        const next = new Set(current);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...Array.from(current), ...visibleIds]);
    });
  }

  async function runBulkAction(action: BulkAction) {
    const ids = Array.from(selectedIds);
    if (!ids.length || bulkLoading) return;

    setBulkLoading(action);
    setError("");

    let payload: Record<string, unknown>;

switch (action) {
  case "archive":
    payload = {
      isArchived: true,
    };
    break;

  case "to_qualify":
    payload = {
      status: "TO_QUALIFY",
    };
    break;

  case "contacted":
    payload = {
      status: "CONTACTED",
    };
    break;

  default:
    throw new Error("Action inconnue.");
}

    try {
      await Promise.all(
        ids.map(async (id) => {
          const response = await fetch(`/api/leads/${id}`, {
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
            throw new Error("Action groupée impossible.");
          }
        }),
      );

      setSelectedIds(new Set());
      await loadLeads({ silent: true });
      showToast("success", `${ids.length} lead${ids.length > 1 ? "s" : ""} mis à jour.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue.";
      setError(message);
      showToast("error", message);
    } finally {
      setBulkLoading(null);
    }
  }

  const selectedCount = selectedIds.size;

  return (
    <AppShell>
      <div className="w-full max-w-full overflow-hidden space-y-6">
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

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Pipeline commercial</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Leads</h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setViewMode((value) => (value === "table" ? "pipeline" : "table"))}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              Vue {viewMode === "table" ? "Pipeline" : "Table"}
            </button>
            <button
              type="button"
              disabled={refreshing || loading}
              onClick={() => void loadLeads({ silent: true })}
              className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-300 hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? "Rafraîchissement..." : "Rafraîchir"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Total leads", kpis.total],
            ["Leads chauds", kpis.hot],
            ["À qualifier", kpis.toQualify],
            ["Archivés", kpis.archived],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        <LeadForm
          onCreated={async () => {
            await loadLeads({ silent: true });
            showToast("success", "Lead créé et cockpit rafraîchi.");
          }}
        />

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
            <input
              value={filters.query}
              onChange={(event) => updateFilter("query", event.target.value)}
              placeholder="Recherche temps réel..."
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 xl:col-span-2"
            />

            <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
              <option value="">Tous statuts</option>
              <option value="new">Nouveau</option>
              <option value="to_qualify">À qualifier</option>
              <option value="qualified">Qualifié</option>
              <option value="contacted">Contacté</option>
              <option value="archived">Archivé</option>
            </select>

            <select value={filters.temperature} onChange={(event) => updateFilter("temperature", event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
              <option value="">Toutes températures</option>
              <option value="cold">Froid</option>
              <option value="warm">Tiède</option>
              <option value="hot">Chaud</option>
            </select>

            <select value={filters.sourceChannel} onChange={(event) => updateFilter("sourceChannel", event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
              <option value="">Toutes sources</option>
              {sourceChannels.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <select value={filters.city} onChange={(event) => updateFilter("city", event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
              <option value="">Toutes villes</option>
              {cities.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <select value={filters.verticale} onChange={(event) => updateFilter("verticale", event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
              <option value="">Toutes verticales</option>
              {verticales.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <input
              value={filters.minScore}
              onChange={(event) => updateFilter("minScore", event.target.value)}
              type="number"
              min="0"
              max="100"
              placeholder="Score min."
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />

            <select value={filters.tag} onChange={(event) => updateFilter("tag", event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
              <option value="">Tous tags</option>
              {tags.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-slate-400">
              {filteredLeads.length} lead{filteredLeads.length > 1 ? "s" : ""} affiché{filteredLeads.length > 1 ? "s" : ""} · {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
            </p>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setFilters(emptyFilters)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                Réinitialiser filtres
              </button>
              <button type="button" disabled={!selectedCount || Boolean(bulkLoading)} onClick={() => void runBulkAction("archive")} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                {bulkLoading === "archive" ? "Archivage..." : "Archiver sélection"}
              </button>
              <button type="button" disabled={!selectedCount || Boolean(bulkLoading)} onClick={() => void runBulkAction("to_qualify")} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                {bulkLoading === "to_qualify" ? "Mise à jour..." : "Marquer TO_QUALIFY"}
              </button>
              <button type="button" disabled={!selectedCount || Boolean(bulkLoading)} onClick={() => void runBulkAction("contacted")} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                {bulkLoading === "contacted" ? "Mise à jour..." : "Marquer CONTACTED"}
              </button>
              <button type="button" disabled={!selectedCount || Boolean(bulkLoading)} onClick={() => setSelectedIds(new Set())} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                Clear sélection
              </button>
            </div>
          </div>
        </section>

        {loading && <LeadsSkeleton />}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && !error && viewMode === "table" && (
  <div className="w-full max-w-full overflow-x-auto overflow-y-hidden rounded-2xl">
    <div className="min-w-max">
      <LeadsTable
        leads={filteredLeads}
        selectedIds={selectedIds}
        onToggleSelected={toggleSelected}
        onToggleAll={toggleAll}
      />
    </div>
  </div>
)}
        {!loading && !error && viewMode === "pipeline" && (
          <div className="grid gap-4 xl:grid-cols-5">
            {pipelineStatuses.map((status) => {
              const columnLeads = filteredLeads.filter((lead) => {
                const leadStatus = lead.isArchived ? "archived" : normalize(lead.status || "new");
                return leadStatus === status;
              });

              return (
                <section key={status} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">{status}</h2>
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{columnLeads.length}</span>
                  </div>

                  <div className="space-y-3">
                    {columnLeads.length === 0 && (
                      <p className="rounded-xl border border-dashed border-slate-800 p-4 text-sm text-slate-500">Aucun lead.</p>
                    )}
                    {columnLeads.map((lead) => (
                      <article key={lead.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">{lead.name || "Sans nom"}</p>
                            <p className="mt-1 text-xs text-slate-500">{lead.city || "Ville inconnue"}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(lead.id)}
                            onChange={() => toggleSelected(lead.id)}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                            aria-label={`Sélectionner ${lead.name || "ce lead"}`}
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`rounded-full border px-2 py-1 text-xs ${badgeClass(lead.temperature)}`}>
                            {lead.temperature || "—"}
                          </span>
                          <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">
                            score {getScore(lead) ?? "—"}
                          </span>
                        </div>
                        <a href={`/leads/${lead.id}`} className="mt-4 inline-block text-sm font-medium text-blue-400 hover:text-blue-300">
                          Ouvrir
                        </a>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function badgeClass(value?: string | null) {
  const normalized = normalize(value);
  if (normalized === "hot") return "border-red-500/30 bg-red-500/15 text-red-300";
  if (normalized === "warm") return "border-amber-500/30 bg-amber-500/15 text-amber-300";
  if (normalized === "cold") return "border-blue-500/30 bg-blue-500/15 text-blue-300";
  return "border-slate-700 bg-slate-800 text-slate-300";
}
