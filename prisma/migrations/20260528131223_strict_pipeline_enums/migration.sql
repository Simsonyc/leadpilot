-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('TO_CONTACT', 'QUALIFICATION', 'MEETING', 'PROPOSAL', 'FOLLOW_UP', 'CLOSING', 'LOST');

-- CreateEnum
CREATE TYPE "LeadTimelineEventType" AS ENUM ('STATUS_CHANGED', 'SCORE_UPDATED', 'SIGNALS_ANALYZED', 'AI_APPROACH_GENERATED', 'NOTE_ADDED', 'NEXT_ACTION_CREATED', 'NEXT_ACTION_COMPLETED', 'NEXT_ACTION_DELETED');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "pipelineStage" "PipelineStage" NOT NULL DEFAULT 'TO_CONTACT';

-- CreateTable
CREATE TABLE "LeadTimelineEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "LeadTimelineEventType" NOT NULL,
    "label" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadTimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadNextAction" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "priority" "ActionPriority" NOT NULL DEFAULT 'MEDIUM',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LeadNextAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadTimelineEvent_leadId_idx" ON "LeadTimelineEvent"("leadId");

-- CreateIndex
CREATE INDEX "LeadTimelineEvent_type_idx" ON "LeadTimelineEvent"("type");

-- CreateIndex
CREATE INDEX "LeadTimelineEvent_createdAt_idx" ON "LeadTimelineEvent"("createdAt");

-- CreateIndex
CREATE INDEX "LeadNextAction_leadId_idx" ON "LeadNextAction"("leadId");

-- CreateIndex
CREATE INDEX "LeadNextAction_dueAt_idx" ON "LeadNextAction"("dueAt");

-- CreateIndex
CREATE INDEX "LeadNextAction_priority_idx" ON "LeadNextAction"("priority");

-- CreateIndex
CREATE INDEX "LeadNextAction_completed_idx" ON "LeadNextAction"("completed");

-- CreateIndex
CREATE INDEX "Lead_pipelineStage_idx" ON "Lead"("pipelineStage");

-- AddForeignKey
ALTER TABLE "LeadTimelineEvent" ADD CONSTRAINT "LeadTimelineEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNextAction" ADD CONSTRAINT "LeadNextAction_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
