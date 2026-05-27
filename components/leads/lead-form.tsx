"use client";

import { FormEvent, useState } from "react";

type LeadFormProps = {
  onCreated?: () => void;
};

export function LeadForm({ onCreated }: LeadFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);

    const payload = {
      name: String(form.get("name") || ""),
      sector: String(form.get("sector") || ""),
      city: String(form.get("city") || ""),
      sourceChannel: String(form.get("sourceChannel") || ""),
      status: String(form.get("status") || "new"),
      temperature: String(form.get("temperature") || "cold"),
      notes: String(form.get("notes") || ""),
      tags: String(form.get("tags") || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch("/api/leads/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error("Création impossible.");
      }

      event.currentTarget.reset();
      setOpen(false);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span>
          <span className="block text-sm font-semibold text-white">
            Créer un lead manuel
          </span>
          <span className="text-xs text-slate-400">
            Ajout rapide depuis terrain, appel ou opportunité entrante.
          </span>
        </span>
        <span className="text-sm text-slate-400">{open ? "Fermer" : "Ouvrir"}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="grid gap-4 border-t border-slate-800 p-5 md:grid-cols-2">
          <input name="name" required placeholder="Nom / entreprise" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500" />
          <input name="sector" placeholder="Secteur" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500" />
          <input name="city" placeholder="Ville" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500" />
          <input name="sourceChannel" placeholder="Source" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500" />

          <select name="status" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm">
            <option value="new">Nouveau</option>
            <option value="to_qualify">À qualifier</option>
            <option value="qualified">Qualifié</option>
            <option value="contacted">Contacté</option>
            <option value="archived">Archivé</option>
          </select>

          <select name="temperature" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm">
            <option value="cold">Froid</option>
            <option value="warm">Tiède</option>
            <option value="hot">Chaud</option>
          </select>

          <input name="tags" placeholder="Tags séparés par virgules" className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500 md:col-span-2" />

          <textarea name="notes" placeholder="Notes terrain" rows={4} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500 md:col-span-2" />

          {error && <p className="text-sm text-red-400 md:col-span-2">{error}</p>}

          <button
            disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 md:col-span-2"
          >
            {loading ? "Création..." : "Créer le lead"}
          </button>
        </form>
      )}
    </section>
  );
}