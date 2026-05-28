"use client";

import { useState } from "react";
import type { LeadUi } from "@/types/lead-ui";

type AiView = {
  id?: string;
  emailSubject?: string | null;
  emailBody?: string | null;
  sms?: string | null;
  linkedInMessage?: string | null;
  callAngle?: string | null;
  miniAudit?: string | null;
  objections?: string[];
  cta?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePossibleJson(value: unknown): unknown {
  if (!value) return null;

  if (isRecord(value)) return value;

  if (typeof value !== "string") return null;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function extractPayload(output: unknown): Record<string, unknown> | null {
  if (!isRecord(output)) {
    const parsed = parsePossibleJson(output);
    return isRecord(parsed) ? parsed : null;
  }

  const directContent =
    output.content ??
    output.output ??
    output.payload ??
    output.data ??
    output.result;

  const parsedContent = parsePossibleJson(directContent);

  if (isRecord(parsedContent)) {
    return parsedContent;
  }

  return output;
}

function normalizeAiOutputs(input: unknown[] | undefined): AiView[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((output, index): AiView | null => {
      const payload = extractPayload(output);

      if (!payload) return null;

      const email = isRecord(payload.email) ? payload.email : null;
      const linkedin = isRecord(payload.linkedin) ? payload.linkedin : null;
      const call = isRecord(payload.call) ? payload.call : null;
      const audit = isRecord(payload.miniAudit) ? payload.miniAudit : null;

      const emailSubject =
        getString(payload.emailSubject) ??
        getString(payload.subject) ??
        getString(email?.subject);

      const emailBody =
        getString(payload.emailBody) ??
        getString(payload.body) ??
        getString(email?.body);

      const sms =
        getString(payload.sms) ??
        getString(payload.smsMessage) ??
        getString(payload.textMessage);

      const linkedInMessage =
        getString(payload.linkedInMessage) ??
        getString(payload.linkedinMessage) ??
        getString(payload.linkedin_message) ??
        getString(linkedin?.message);

      const callAngle =
        getString(payload.callAngle) ??
        getString(payload.call_angle) ??
        getString(call?.angle) ??
        getString(call?.script);

      const miniAudit =
        getString(payload.miniAudit) ??
        getString(payload.mini_audit) ??
        getString(payload.audit) ??
        getString(audit?.summary) ??
        getString(audit?.content);

      const objections =
        getStringArray(payload.objections).length > 0
          ? getStringArray(payload.objections)
          : getStringArray(payload.commonObjections);

      const cta =
        getString(payload.cta) ??
        getString(payload.callToAction) ??
        getString(payload.nextStep);

      const hasContent =
        emailSubject ||
        emailBody ||
        sms ||
        linkedInMessage ||
        callAngle ||
        miniAudit ||
        objections.length > 0 ||
        cta;

      if (!hasContent) return null;

      const id =
        isRecord(output) && typeof output.id === "string"
          ? output.id
          : String(index);

      return {
        id,
        emailSubject,
        emailBody,
        sms,
        linkedInMessage,
        callAngle,
        miniAudit,
        objections,
        cta,
      };
    })
    .filter((item): item is AiView => item !== null);
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
    >
      {copied ? "Copié" : "Copier"}
    </button>
  );
}

function AiSection({
  title,
  value,
  multiline = true,
}: {
  title: string;
  value?: string | null;
  multiline?: boolean;
}) {
  if (!value) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          {title}
        </p>
        <CopyButton value={value} />
      </div>

      <p
        className={
          multiline
            ? "whitespace-pre-wrap text-sm leading-6 text-slate-300"
            : "text-sm font-medium text-white"
        }
      >
        {value}
      </p>
    </div>
  );
}

export function LeadAiPanel({ lead }: { lead: LeadUi }) {
  const outputs = normalizeAiOutputs(lead.aiOutputs);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">IA commerciale</h2>
          <p className="mt-1 text-sm text-slate-400">
            Messages, angles d’approche et synthèse commerciale générés pour ce lead.
          </p>
        </div>

        {outputs.length > 0 && (
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-400">
            {outputs.length} sortie{outputs.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {!outputs.length ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-5">
          <p className="text-sm font-medium text-slate-300">
            Aucun contenu IA disponible.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Lance le moteur commercial IA pour générer les messages d’approche.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {outputs.map((output) => (
            <div
              key={output.id}
              className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
            >
              <AiSection
                title="Email — objet"
                value={output.emailSubject}
                multiline={false}
              />

              <AiSection title="Email — corps" value={output.emailBody} />

              <AiSection title="SMS" value={output.sms} />

              <AiSection
                title="Message LinkedIn"
                value={output.linkedInMessage}
              />

              <AiSection title="Angle d’appel" value={output.callAngle} />

              <AiSection title="Mini audit" value={output.miniAudit} />

              {(output.objections ?? []).length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Objections
                    </p>
                    <CopyButton value={(output.objections ?? []).join("\n")} />
                  </div>

                  <ul className="space-y-2 text-sm text-slate-300">
                    {(output.objections ?? []).map((objection, index) => (
                      <li key={`${objection}-${index}`} className="leading-6">
                        • {objection}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <AiSection title="CTA" value={output.cta} multiline={false} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}