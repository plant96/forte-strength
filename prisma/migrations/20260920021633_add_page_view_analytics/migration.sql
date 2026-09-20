-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('DESKTOP', 'MOBILE', 'TABLET', 'BOT', 'UNKNOWN');

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "referrer" TEXT,
    "referrerHost" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "ipAddress" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "device" "DeviceType" NOT NULL DEFAULT 'UNKNOWN',
    "screenW" INTEGER,
    "screenH" INTEGER,
    "viewportW" INTEGER,
    "viewportH" INTEGER,
    "language" TEXT,
    "durationMs" INTEGER,
    "isEntry" BOOLEAN NOT NULL DEFAULT false,
    "isBot" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageView_createdAt_idx" ON "PageView"("createdAt");

-- CreateIndex
CREATE INDEX "PageView_isBot_createdAt_idx" ON "PageView"("isBot", "createdAt");

-- CreateIndex
CREATE INDEX "PageView_visitorId_createdAt_idx" ON "PageView"("visitorId", "createdAt");

-- CreateIndex
CREATE INDEX "PageView_sessionId_createdAt_idx" ON "PageView"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "PageView_path_createdAt_idx" ON "PageView"("path", "createdAt");

-- CreateIndex
CREATE INDEX "PageView_country_createdAt_idx" ON "PageView"("country", "createdAt");

-- CreateIndex
CREATE INDEX "PageView_referrerHost_createdAt_idx" ON "PageView"("referrerHost", "createdAt");
