-- CreateEnum
CREATE TYPE "ComingSoonKind" AS ENUM ('TOOL', 'RESOURCE');

-- CreateEnum
CREATE TYPE "BugReportStatus" AS ENUM ('OPEN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MilestoneKind" AS ENUM ('VISITORS', 'USERS', 'ONLINE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingRequired" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ComingSoonItem" (
    "id" TEXT NOT NULL,
    "kind" "ComingSoonKind" NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComingSoonItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BugReport" (
    "id" TEXT NOT NULL,
    "status" "BugReportStatus" NOT NULL DEFAULT 'OPEN',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "email" TEXT,
    "path" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userAgent" TEXT,

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "NotificationMilestone" (
    "kind" "MilestoneKind" NOT NULL,
    "threshold" INTEGER NOT NULL,
    "reachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationMilestone_pkey" PRIMARY KEY ("kind","threshold")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComingSoonItem_kind_createdAt_idx" ON "ComingSoonItem"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "BugReport_status_createdAt_idx" ON "BugReport"("status", "createdAt");
