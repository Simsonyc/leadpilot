/*
  Warnings:

  - Added the required column `updatedAt` to the `LeadScore` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lead" ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "LeadScore" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "LeadWeakSignal" ALTER COLUMN "confidence" DROP NOT NULL;
