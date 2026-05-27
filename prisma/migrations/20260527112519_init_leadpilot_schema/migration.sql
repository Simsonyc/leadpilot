-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'TO_QUALIFY', 'QUALIFIED', 'CONTACTED', 'IN_PROGRESS', 'WON', 'LOST', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeadTemperature" AS ENUM ('COLD', 'WARM', 'HOT');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MANUAL', 'GHL', 'EMAIL', 'SMS', 'CALL', 'LINKEDIN', 'NOTE', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "ActionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verticale" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Verticale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "source" TEXT,
    "sourceChannel" TEXT,
    "sector" TEXT,
    "city" TEXT,
    "department" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "channels" JSONB,
    "rawPayload" JSONB,
    "metadata" JSONB,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "statusReason" TEXT,
    "temperature" "LeadTemperature" NOT NULL DEFAULT 'COLD',
    "globalScore" INTEGER,
    "confidenceScore" DOUBLE PRECISION,
    "ghlContactId" TEXT,
    "ghlOpportunityId" TEXT,
    "ghlPipelineId" TEXT,
    "ghlStageId" TEXT,
    "verticaleId" TEXT,
    "assignedToId" TEXT,
    "nextActionAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeakSignal" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "defaultWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeakSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadWeakSignal" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "weakSignalId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidence" TEXT,
    "value" TEXT,
    "weightApplied" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadWeakSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadScore" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "businessPainScore" INTEGER,
    "digitalWeaknessScore" INTEGER,
    "growthPotentialScore" INTEGER,
    "automationMaturityScore" INTEGER,
    "urgencyScore" INTEGER,
    "visibilityGapScore" INTEGER,
    "fitVerticaleScore" INTEGER,
    "globalScore" INTEGER,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAiOutput" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "channel" TEXT,
    "sms" TEXT,
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "linkedinMessage" TEXT,
    "callAngle" TEXT,
    "diagnostic" TEXT,
    "modelUsed" TEXT,
    "provider" TEXT,
    "promptVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadAiOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "EventType" NOT NULL,
    "source" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "payload" JSONB,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionQueue" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "recommendedAction" TEXT,
    "priority" "ActionPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ActionQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "context" TEXT,
    "payload" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Verticale_name_key" ON "Verticale"("name");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_temperature_idx" ON "Lead"("temperature");

-- CreateIndex
CREATE INDEX "Lead_globalScore_idx" ON "Lead"("globalScore");

-- CreateIndex
CREATE INDEX "Lead_confidenceScore_idx" ON "Lead"("confidenceScore");

-- CreateIndex
CREATE INDEX "Lead_verticaleId_idx" ON "Lead"("verticaleId");

-- CreateIndex
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");

-- CreateIndex
CREATE INDEX "Lead_sourceChannel_idx" ON "Lead"("sourceChannel");

-- CreateIndex
CREATE INDEX "Lead_lastActivityAt_idx" ON "Lead"("lastActivityAt");

-- CreateIndex
CREATE INDEX "Lead_nextActionAt_idx" ON "Lead"("nextActionAt");

-- CreateIndex
CREATE INDEX "Lead_isArchived_idx" ON "Lead"("isArchived");

-- CreateIndex
CREATE INDEX "Lead_deletedAt_idx" ON "Lead"("deletedAt");

-- CreateIndex
CREATE INDEX "Lead_ghlContactId_idx" ON "Lead"("ghlContactId");

-- CreateIndex
CREATE UNIQUE INDEX "WeakSignal_code_key" ON "WeakSignal"("code");

-- CreateIndex
CREATE INDEX "WeakSignal_category_idx" ON "WeakSignal"("category");

-- CreateIndex
CREATE INDEX "LeadWeakSignal_leadId_idx" ON "LeadWeakSignal"("leadId");

-- CreateIndex
CREATE INDEX "LeadWeakSignal_weakSignalId_idx" ON "LeadWeakSignal"("weakSignalId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadWeakSignal_leadId_weakSignalId_key" ON "LeadWeakSignal"("leadId", "weakSignalId");

-- CreateIndex
CREATE INDEX "LeadScore_leadId_idx" ON "LeadScore"("leadId");

-- CreateIndex
CREATE INDEX "LeadScore_globalScore_idx" ON "LeadScore"("globalScore");

-- CreateIndex
CREATE INDEX "LeadAiOutput_leadId_idx" ON "LeadAiOutput"("leadId");

-- CreateIndex
CREATE INDEX "LeadAiOutput_channel_idx" ON "LeadAiOutput"("channel");

-- CreateIndex
CREATE INDEX "LeadAiOutput_provider_idx" ON "LeadAiOutput"("provider");

-- CreateIndex
CREATE INDEX "LeadAiOutput_promptVersion_idx" ON "LeadAiOutput"("promptVersion");

-- CreateIndex
CREATE INDEX "LeadEvent_leadId_idx" ON "LeadEvent"("leadId");

-- CreateIndex
CREATE INDEX "LeadEvent_userId_idx" ON "LeadEvent"("userId");

-- CreateIndex
CREATE INDEX "LeadEvent_type_idx" ON "LeadEvent"("type");

-- CreateIndex
CREATE INDEX "LeadEvent_occurredAt_idx" ON "LeadEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "ActionQueue_leadId_idx" ON "ActionQueue"("leadId");

-- CreateIndex
CREATE INDEX "ActionQueue_userId_idx" ON "ActionQueue"("userId");

-- CreateIndex
CREATE INDEX "ActionQueue_priority_idx" ON "ActionQueue"("priority");

-- CreateIndex
CREATE INDEX "ActionQueue_status_idx" ON "ActionQueue"("status");

-- CreateIndex
CREATE INDEX "ActionQueue_dueDate_idx" ON "ActionQueue"("dueDate");

-- CreateIndex
CREATE INDEX "ActionQueue_isArchived_idx" ON "ActionQueue"("isArchived");

-- CreateIndex
CREATE INDEX "ActionQueue_deletedAt_idx" ON "ActionQueue"("deletedAt");

-- CreateIndex
CREATE INDEX "SystemLog_level_idx" ON "SystemLog"("level");

-- CreateIndex
CREATE INDEX "SystemLog_userId_idx" ON "SystemLog"("userId");

-- CreateIndex
CREATE INDEX "SystemLog_createdAt_idx" ON "SystemLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_verticaleId_fkey" FOREIGN KEY ("verticaleId") REFERENCES "Verticale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadWeakSignal" ADD CONSTRAINT "LeadWeakSignal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadWeakSignal" ADD CONSTRAINT "LeadWeakSignal_weakSignalId_fkey" FOREIGN KEY ("weakSignalId") REFERENCES "WeakSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadScore" ADD CONSTRAINT "LeadScore_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAiOutput" ADD CONSTRAINT "LeadAiOutput_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionQueue" ADD CONSTRAINT "ActionQueue_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionQueue" ADD CONSTRAINT "ActionQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemLog" ADD CONSTRAINT "SystemLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
