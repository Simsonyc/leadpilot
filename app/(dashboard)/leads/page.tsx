"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { LeadForm } from "@/components/leads/lead-form";
import { LeadsTable } from "@/components/leads/leads-table";

type Lead = {
  id: string;
  name?: string | null;
  sector?: string | null;
  city?: string | null;
  sourceChannel?: string | null;
  status?: string | null;
  temperature?: string | null;
  isArchived?: boolean | null;
  tags?: string[] | null;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [temperature, setTemperature] = useState("");
  const [source, setSource] = useState("");

  async function loadLeads() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/leads", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error("Impossible de charger les leads.");
      }

      setLeads(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const text = `${lead.name || ""} ${lead.sector || ""} ${lead.city || ""} ${(lead.tags || []).join(" ")}`.toLowerCase();

      return (
        text.includes(query.toLowerCase()) &&
        (!status || lead.status === status || (status === "archived" && lead.isArchived)) &&
        (!temperature || lead.temperature === temperature) &&
        (!source || lead.sourceChannel === source)
      );
    });
  }, [leads, query, status, temperature, source]);

  const sources = Array.from(new Set(leads.map((lead) => lead.sourceChannel).filter(Boolean)));

  const kpis = {
    total: leads.length,
    hot: leads.filter((lead) => lead.temperature === "hot").length,
    toQualify: leads.filter((lead) => lead.status === "to_qualify").length,
    archived: leads.filter((lead) => lead.isArchived || lead.status === "archived").length,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Pipeline commercial</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Leads</h1>
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

        <LeadForm onCreated={loadLeads} />

        <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher nom, ville, secteur, tag..."
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500 md:col-span-1"
          />

          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm">
            <option value="">Tous statuts</option>
            <option value="new">Nouveau</option>
            <option value="to_qualify">À qualifier</option>
            <option value="qualified">Qualifié</option>
            <option value="contacted">Contacté</option>
            <option value="archived">Archivé</option>
          </select>

          <select value={temperature} onChange={(event) => setTemperature(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm">
            <option value="">Toutes températures</option>
            <option value="cold">Froid</option>
            <option value="warm">Tiède</option>
            <option value="hot">Chaud</option>
          </select>

          <select value={source} onChange={(event) => setSource(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm">
            <option value="">Toutes sources</option>
            {sources.map((item) => (
              <option key={item} value={item || ""}>{item}</option>
            ))}
          </select>
        </div>

        {loading && <p className="text-sm text-slate-400">Chargement des leads...</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && !error && <LeadsTable leads={filteredLeads} />}
      </div>
    </AppShell>
  );
}