-- DropIndex
DROP INDEX "PrEntry_seriesId_achievedOn_idx";

-- DropIndex
DROP INDEX "PrEntry_seriesId_achievedOn_key";

-- CreateIndex
CREATE INDEX "PrEntry_seriesId_achievedOn_createdAt_idx" ON "PrEntry"("seriesId", "achievedOn", "createdAt");
