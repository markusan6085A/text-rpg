-- AlterTable
ALTER TABLE "Character" ADD COLUMN "nickColor" TEXT;

-- CreateIndex
CREATE INDEX "Letter_fromCharacterId_toCharacterId_createdAt_idx" ON "Letter"("fromCharacterId", "toCharacterId", "createdAt");

-- CreateIndex
CREATE INDEX "Letter_toCharacterId_fromCharacterId_createdAt_idx" ON "Letter"("toCharacterId", "fromCharacterId", "createdAt");
