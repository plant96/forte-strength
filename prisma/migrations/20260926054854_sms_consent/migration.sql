-- CreateEnum
CREATE TYPE "SmsConsentAction" AS ENUM ('OPT_IN', 'OPT_OUT');

-- CreateEnum
CREATE TYPE "SmsConsentSource" AS ENUM ('DASHBOARD', 'SETTINGS', 'SMS_PAGE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "smsOptInAt" TIMESTAMP(3),
ADD COLUMN     "smsPhone" TEXT,
ADD COLUMN     "smsPromptSnoozedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SmsConsentEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "action" "SmsConsentAction" NOT NULL,
    "source" "SmsConsentSource" NOT NULL,
    "consentText" TEXT,
    "consentVersion" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsConsentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SmsConsentEvent_userId_createdAt_idx" ON "SmsConsentEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SmsConsentEvent_phone_createdAt_idx" ON "SmsConsentEvent"("phone", "createdAt");
