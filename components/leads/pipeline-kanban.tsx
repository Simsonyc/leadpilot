"use client";

import Link from "next/link";
import {
  DndContext,
  type DragEndEvent,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { CSSProperties, ReactNode } from "react";
import type { LeadUi } from "@/types/lead-ui";

export type PipelineStage =
  | "TO_CONTACT"
  | "QUALIFICATION"
  | "MEETING"
  | "PROPOSAL"
  | "FOLLOW_UP"
  | "CLOSING"
  | "LOST";

const pipelineStages: Array<{ value: PipelineStage; label: string }> = [
  { value: "TO_CONTACT", label: "À contacter" },
  { value: "QUALIFICATION", label: "Qualification" },
  { value: "MEETING", label: "RDV" },
  { value: "PROPOSAL", label: "Proposition" },
  { value: "FOLLOW_UP", label: "Relance" },
  { value: "CLOSING", label: "Closing" },
  { value: "LOST", label: "Perdu" },
];

type PipelineKanbanProps = {
  leads: LeadUi[];
  selectedIds: Set<string>;
  onToggleSelected: (id: string) => void;
  onStageChange: (leadId: string, stage: PipelineStage) => Promise<void>;
};

function getScore(lead: LeadUi) {
  return lead.globalScore ?? lead.score ?? null;
}

function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR").format(date);
}

function badgeClass(value?: string | null) {
  const normalized = String(value || "").toLowerCase();

  if (normalized === "hot") return "border-red-500/30 bg-red-500/15 text-red-300";
  if (normalized === "warm") return "border-amber-500/30 bg-amber-500/15 text-amber-300";
  if (normalized === "cold") return "border-blue-500/30 bg-blue-500/15 text-blue-300";

  return "border-slate-700 bg-slate-800 text-slate-300";
}

function normalizeStage(stage?: LeadUi["pipelineStage"] | null): PipelineStage {
  if (
    stage === "TO_CONTACT" ||
    stage === "QUALIFICATION" ||
    stage === "MEETING" ||
    stage === "PROPOSAL" ||
    stage === "FOLLOW_UP" ||
    stage === "CLOSING" ||
    stage === "LOST"
  ) {
    return stage;
  }

  return "TO_CONTACT";
}

function KanbanColumn({
  stage,
  label,
  leads,
  children,
}: {
  stage: PipelineStage;
  label: string;
  leads: LeadUi[];
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { stage },
  });

  return (
    <section
      ref={setNodeRef}
      className={`flex max-h-[calc(100vh-280px)] min-h-[560px] w-[320px] shrink-0 flex-col rounded-2xl border p-4 transition-colors ${
        isOver
          ? "border-blue-500/50 bg-blue-500/10"
          : "border-slate-800 bg-slate-900/60"
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold uppercase tracking-wider text-slate-300">
            {label}
          </h2>
          <p className="mt-1 text-xs text-slate-500">{stage}</p>
        </div>

        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
          {leads.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {leads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-4 text-sm text-slate-500">
            Aucun lead.
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function KanbanCard({
  lead,
  selected,
  onToggleSelected,
}: {
  lead: LeadUi;
  selected: boolean;
  onToggleSelected: (id: string) => void;
}) {
  const stage = normalizeStage(lead.pipelineStage);
  const score = getScore(lead);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: lead.id,
      data: {
        leadId: lead.id,
        stage,
      },
    });

  const style: CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-slate-950 p-4 shadow-sm transition ${
        isDragging
          ? "z-50 border-blue-500/50 opacity-80 shadow-xl"
          : "border-slate-800 hover:border-slate-700"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="min-w-0 flex-1 cursor-grab text-left active:cursor-grabbing"
          aria-label={`Déplacer ${lead.name || "ce lead"}`}
        >
          <p className="truncate font-medium text-white">{lead.name || "Sans nom"}</p>
          <p className="mt-1 truncate text-xs text-slate-500">
            {lead.city || "Ville inconnue"} · {lead.sourceChannel || "Source inconnue"}
          </p>
        </button>

        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelected(lead.id)}
          className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950"
          aria-label={`Sélectionner ${lead.name || "ce lead"}`}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={`rounded-full border px-2 py-1 text-xs ${badgeClass(lead.temperature)}`}>
          {lead.temperature || "—"}
        </span>

        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300">
          score {score ?? "—"}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-slate-400">
        <div>
          <span className="text-slate-500">Prochaine action : </span>
          {formatDate(lead.nextActionAt)}
        </div>

        <div>
          <span className="text-slate-500">Pipeline : </span>
          {stage}
        </div>
      </div>

      {(lead.tags || []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {(lead.tags || []).slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
              {tag}
            </span>
          ))}
        </div>
      )}

      <Link
        href={`/leads/${lead.id}`}
        className="mt-4 inline-flex rounded-lg border border-blue-500/20 px-3 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/10 hover:text-blue-300"
      >
        Ouvrir
      </Link>
    </article>
  );
}

export function PipelineKanban({
  leads,
  selectedIds,
  onToggleSelected,
  onStageChange,
}: PipelineKanbanProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const leadId = event.active.data.current?.leadId;
    const nextStage = event.over?.data.current?.stage;

    if (
      typeof leadId !== "string" ||
      !pipelineStages.some((stage) => stage.value === nextStage)
    ) {
      return;
    }

    const lead = leads.find((item) => item.id === leadId);
    const currentStage = normalizeStage(lead?.pipelineStage);

    if (currentStage === nextStage) return;

    await onStageChange(leadId, nextStage as PipelineStage);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="w-full max-w-full overflow-hidden rounded-2xl">
        <div className="w-full max-w-full overflow-x-auto overflow-y-hidden pb-3">
          <div className="flex min-w-max gap-4">
            {pipelineStages.map((stage) => {
              const columnLeads = leads.filter(
                (lead) => normalizeStage(lead.pipelineStage) === stage.value,
              );

              return (
                <KanbanColumn
                  key={stage.value}
                  stage={stage.value}
                  label={stage.label}
                  leads={columnLeads}
                >
                  {columnLeads.map((lead) => (
                    <KanbanCard
                      key={lead.id}
                      lead={lead}
                      selected={selectedIds.has(lead.id)}
                      onToggleSelected={onToggleSelected}
                    />
                  ))}
                </KanbanColumn>
              );
            })}
          </div>
        </div>
      </div>
    </DndContext>
  );
}