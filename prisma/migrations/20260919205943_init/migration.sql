-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('LB', 'KG');

-- CreateEnum
CREATE TYPE "HeightUnit" AS ENUM ('FT_IN', 'CM');

-- CreateEnum
CREATE TYPE "Intensity" AS ENUM ('VERY_LIGHT', 'LIGHT', 'MODERATE', 'HARD', 'VERY_HARD');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('UNPROCESSED', 'PROCESSED');

-- CreateEnum
CREATE TYPE "CoachingNeed" AS ENUM ('COMPETITIVE_POWERLIFTING', 'RECREATIONAL_POWERLIFTING', 'WEIGHT_LOSS_RECOMP', 'OTHER');

-- CreateEnum
CREATE TYPE "CurrentCoach" AS ENUM ('YES_LOOKING_FOR_BETTER', 'NO_BUT_HAVE_BEFORE', 'NO_NEVER');

-- CreateEnum
CREATE TYPE "FinancePriority" AS ENUM ('MOST_COST_EFFECTIVE', 'SOLID_AFFORDABLE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "Readiness" AS ENUM ('READY_NOW', 'NEED_TO_PREPARE', 'NOT_SURE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "onboardedAt" TIMESTAMP(3),
    "onboardingSkippedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "userId" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "sex" "Sex" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "weightUnit" "WeightUnit" NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "heightUnit" "HeightUnit" NOT NULL,
    "bodyFatPercent" DOUBLE PRECISION NOT NULL,
    "stepsPerDay" INTEGER NOT NULL,
    "sessionsPerWeek" INTEGER NOT NULL,
    "intensity" "Intensity",
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'UNPROCESSED',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fullName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "instagram" TEXT NOT NULL,
    "primaryNeed" "CoachingNeed" NOT NULL,
    "primaryNeedOther" TEXT,
    "squat" DOUBLE PRECISION NOT NULL,
    "bench" DOUBLE PRECISION NOT NULL,
    "deadlift" DOUBLE PRECISION NOT NULL,
    "liftUnit" "WeightUnit" NOT NULL,
    "liftsAreCompetition" BOOLEAN NOT NULL,
    "weightClass" TEXT NOT NULL,
    "goals" TEXT NOT NULL,
    "challenges" TEXT NOT NULL,
    "overthinker" INTEGER NOT NULL,
    "injuries" TEXT NOT NULL,
    "nutritionRestrictions" TEXT NOT NULL,
    "programming" TEXT NOT NULL,
    "currentCoach" "CurrentCoach" NOT NULL,
    "whyForte" TEXT NOT NULL,
    "commitment" TEXT NOT NULL,
    "financePriority" "FinancePriority" NOT NULL,
    "readiness" "Readiness" NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachProfile" (
    "id" TEXT NOT NULL DEFAULT 'coach',
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "yearsExperience" INTEGER NOT NULL,
    "bio" TEXT NOT NULL,
    "worldRecords" INTEGER NOT NULL,
    "americanRecords" INTEGER NOT NULL,
    "stateRecords" INTEGER NOT NULL,
    "homeBase" TEXT NOT NULL,
    "reach" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Application_status_createdAt_idx" ON "Application"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Application_createdAt_idx" ON "Application"("createdAt");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
