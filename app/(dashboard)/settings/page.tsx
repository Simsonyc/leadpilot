"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";

// ── Types ──────────────────────────────────────────────────────

type Settings = {
  ghl_auto_sync: string;
  ai_provider: string;
  ai_fallback_provider: string;
};

type ToastKind = "success" | "error";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

// ── Composant Toggle ───────────────────────────────────────────

function Toggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
        enabled ? "bg-blue-600" : "bg-slate-700"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ── Composant Section ──────────────────────────────────────────

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

// ── Composant Row ──────────────────────────────────────────────

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  function showToast(kind: ToastKind, message: string) {
    setToast({ id: Date.now(), kind, message });
  }

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/settings");
      const result: unknown = await response.json();

      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("success" in result) ||
        result.success !== true ||
        !("data" in result)
      ) {
        throw new Error("Impossible de charger les paramètres.");
      }

      setSettings(result.data as Settings);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function updateSetting(key: keyof Settings, value: string) {
    if (!settings) return;

    const optimistic = { ...settings, [key]: value };
    setSettings(optimistic);
    setSaving(true);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
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
        throw new Error("Mise à jour impossible.");
      }

      setSettings(result.data as Settings);
      showToast("success", "Paramètre mis à jour.");
    } catch (err) {
      setSettings(settings);
      showToast("error", err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60"
            />
          ))}
        </div>
      </AppShell>
    );
  }

  if (!settings) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
          Impossible de charger les paramètres.
        </div>
      </AppShell>
    );
  }

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

      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
            Configuration
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Paramètres
          </h1>
        </div>

        {/* GoHighLevel */}
        <SettingsSection
          title="GoHighLevel"
          description="Configuration de la synchronisation avec votre sous-compte GHL."
        >
          <SettingRow
            label="Synchronisation automatique"
            description="Synchronise automatiquement chaque lead vers GHL après chaque mise à jour, score ou génération IA."
          >
            <Toggle
              enabled={settings.ghl_auto_sync === "true"}
              onChange={(value) =>
                void updateSetting("ghl_auto_sync", value ? "true" : "false")
              }
              disabled={saving}
            />
          </SettingRow>

          <SettingRow
            label="Mode actuel"
            description={
              settings.ghl_auto_sync === "true"
                ? "Les leads sont synchronisés automatiquement vers GHL."
                : "La synchronisation est manuelle — utilisez le bouton dans chaque fiche lead."
            }
          >
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                settings.ghl_auto_sync === "true"
                  ? "border-emerald-500/30 text-emerald-400"
                  : "border-slate-600 text-slate-400"
              }`}
            >
              {settings.ghl_auto_sync === "true" ? "Auto" : "Manuel"}
            </span>
          </SettingRow>
        </SettingsSection>

        {/* IA */}
        <SettingsSection
          title="Intelligence artificielle"
          description="Choisissez le provider IA principal et le fallback."
        >
          <SettingRow
            label="Provider principal"
            description="Utilisé pour la génération d'approches commerciales et l'analyse."
          >
            <select
              value={settings.ai_provider}
              disabled={saving}
              onChange={(e) => void updateSetting("ai_provider", e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value="claude">Claude (Anthropic)</option>
              <option value="openai">OpenAI GPT-4</option>
            </select>
          </SettingRow>

          <SettingRow
            label="Provider fallback"
            description="Utilisé automatiquement si le provider principal échoue."
          >
            <select
              value={settings.ai_fallback_provider}
              disabled={saving}
              onChange={(e) =>
                void updateSetting("ai_fallback_provider", e.target.value)
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value="openai">OpenAI GPT-4</option>
              <option value="claude">Claude (Anthropic)</option>
              <option value="none">Aucun fallback</option>
            </select>
          </SettingRow>
        </SettingsSection>

        {/* Informations système */}
        <SettingsSection
          title="Informations système"
          description="Variables d'environnement configurées."
        >
          {[
            {
              label: "ANTHROPIC_API_KEY",
              configured: Boolean(process.env.NEXT_PUBLIC_ANTHROPIC_CONFIGURED),
              description: "Clé API Claude — configurée dans Vercel",
            },
            {
              label: "GHL_API_KEY",
              configured: Boolean(process.env.NEXT_PUBLIC_GHL_CONFIGURED),
              description: "Clé API GoHighLevel — configurée dans Vercel",
            },
            {
              label: "DATABASE_URL",
              configured: true,
              description: "Base de données Neon PostgreSQL",
            },
          ].map((item) => (
            <SettingRow
              key={item.label}
              label={item.label}
              description={item.description}
            >
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  item.configured
                    ? "border-emerald-500/30 text-emerald-400"
                    : "border-amber-500/30 text-amber-400"
                }`}
              >
                {item.configured ? "Configuré" : "À configurer"}
              </span>
            </SettingRow>
          ))}
        </SettingsSection>
      </div>
    </AppShell>
  );
}
