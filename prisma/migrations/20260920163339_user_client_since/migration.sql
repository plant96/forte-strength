-- AlterTable
ALTER TABLE "User" ADD COLUMN     "clientSince" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_clientSince_idx" ON "User"("clientSince");
