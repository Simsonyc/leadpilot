"use client";

import { FormEvent, useRef, useState } from "react";

type LeadFormProps = {
  onCreated?: () => Promise<void> | void;
};

export function LeadForm({ onCreated }: LeadFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") || "").trim(),
      contactName: String(formData.get("contactName") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      website: String(formData.get("website") || "").trim() || null,
      sector: String(formData.get("sector") || "").trim() || null,
      city: String(formData.get("city") || "").trim() || null,
      sourceChannel: String(formData.get("sourceChannel") || "").trim() || null,
      status: String(formData.get("status") || "new"),
      temperature: String(formData.get("temperature") || "cold"),
      notes: String(formData.get("notes") || "").trim() || null,
      tags: String(formData.get("tags") || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    if (!payload.name) {
      setError("Le nom du lead est obligatoire.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/leads/manual", {
        method: "POST",
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
        throw new Error("Création impossible.");
      }

      formRef.current?.reset();
      setSuccess("Lead créé avec succès.");
      await onCreated?.();
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

      {(success || error) && (
        <div className="border-t border-slate-800 px-5 py-3">
          {success && <p className="text-sm text-emerald-400">{success}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      )}

      {open && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="border-t border-slate-800 p-5"
        >
          <div className="grid gap-4 md:grid-cols-2">

            {/* Identification */}
            <input
              name="name"
              required
              disabled={loading}
              placeholder="Nom / entreprise *"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
            />

            <input
              name="contactName"
              disabled={loading}
              placeholder="Nom du contact"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
            />

            {/* Contact */}
            <input
              name="email"
              type="email"
              disabled={loading}
              placeholder="Email"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
            />

            <input
              name="phone"
              type="tel"
              disabled={loading}
              placeholder="Téléphone"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
            />

            <input
              name="website"
              type="url"
              disabled={loading}
              placeholder="Site web (https://...)"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50 md:col-span-2"
            />

            {/* Qualification */}
            <input
              name="sector"
              disabled={loading}
              placeholder="Secteur"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
            />

            <input
              name="city"
              disabled={loading}
              placeholder="Ville"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
            />

            <input
              name="sourceChannel"
              disabled={loading}
              placeholder="Source"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
            />

            <input
              name="tags"
              disabled={loading}
              placeholder="Tags séparés par virgules"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
            />

            {/* Statut */}
            <select
              name="status"
              disabled={loading}
              defaultValue="new"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white disabled:opacity-50"
            >
              <option value="new">Nouveau</option>
              <option value="to_qualify">À qualifier</option>
              <option value="qualified">Qualifié</option>
              <option value="contacted">Contacté</option>
              <option value="archived">Archivé</option>
            </select>

            <select
              name="temperature"
              disabled={loading}
              defaultValue="cold"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white disabled:opacity-50"
            >
              <option value="cold">Froid</option>
              <option value="warm">Tiède</option>
              <option value="hot">Chaud</option>
            </select>

            <textarea
              name="notes"
              disabled={loading}
              placeholder="Notes terrain"
              rows={4}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50 md:col-span-2"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
            >
              {loading ? "Création..." : "Créer le lead"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
