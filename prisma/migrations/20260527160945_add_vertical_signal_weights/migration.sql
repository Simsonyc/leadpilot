-- CreateTable
CREATE TABLE "VerticalSignalWeight" (
    "id" TEXT NOT NULL,
    "verticaleId" TEXT NOT NULL,
    "weakSignalId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerticalSignalWeight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerticalSignalWeight_verticaleId_idx" ON "VerticalSignalWeight"("verticaleId");

-- CreateIndex
CREATE INDEX "VerticalSignalWeight_weakSignalId_idx" ON "VerticalSignalWeight"("weakSignalId");

-- CreateIndex
CREATE INDEX "VerticalSignalWeight_isActive_idx" ON "VerticalSignalWeight"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "VerticalSignalWeight_verticaleId_weakSignalId_key" ON "VerticalSignalWeight"("verticaleId", "weakSignalId");

-- AddForeignKey
ALTER TABLE "VerticalSignalWeight" ADD CONSTRAINT "VerticalSignalWeight_verticaleId_fkey" FOREIGN KEY ("verticaleId") REFERENCES "Verticale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerticalSignalWeight" ADD CONSTRAINT "VerticalSignalWeight_weakSignalId_fkey" FOREIGN KEY ("weakSignalId") REFERENCES "WeakSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
