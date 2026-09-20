-- CreateEnum
CREATE TYPE "PrKind" AS ENUM ('ONE_REP_MAX', 'REP', 'VOLUME');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "liftUnit" "WeightUnit" NOT NULL DEFAULT 'LB';

-- Seed the gym-weight preference from the bodyweight unit the user already
-- chose during onboarding. It is a better guess than the LB default, and they
-- can still change it. Accounts with no profile keep the default.
UPDATE "User" u SET "liftUnit" = p."weightUnit"
FROM "Profile" p WHERE p."userId" = u."id";

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrSeries" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "PrKind" NOT NULL,
    "sets" INTEGER NOT NULL DEFAULT 1,
    "reps" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrEntry" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "achievedOn" DATE NOT NULL,
    "loggedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Exercise_userId_updatedAt_idx" ON "Exercise"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_userId_slug_key" ON "Exercise"("userId", "slug");

-- CreateIndex
CREATE INDEX "PrSeries_userId_exerciseId_idx" ON "PrSeries"("userId", "exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "PrSeries_exerciseId_kind_sets_reps_key" ON "PrSeries"("exerciseId", "kind", "sets", "reps");

-- CreateIndex
CREATE INDEX "PrEntry_seriesId_achievedOn_idx" ON "PrEntry"("seriesId", "achievedOn");

-- CreateIndex
CREATE UNIQUE INDEX "PrEntry_seriesId_achievedOn_key" ON "PrEntry"("seriesId", "achievedOn");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrSeries" ADD CONSTRAINT "PrSeries_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrSeries" ADD CONSTRAINT "PrSeries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrEntry" ADD CONSTRAINT "PrEntry_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "PrSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrEntry" ADD CONSTRAINT "PrEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
