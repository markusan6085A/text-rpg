-- CreateTable
CREATE TABLE "PlayerActivityLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "clientIp" TEXT,

    CONSTRAINT "PlayerActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerActivityLog_createdAt_idx" ON "PlayerActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "PlayerActivityLog_characterId_createdAt_idx" ON "PlayerActivityLog"("characterId", "createdAt");

-- CreateIndex
CREATE INDEX "PlayerActivityLog_accountId_createdAt_idx" ON "PlayerActivityLog"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "PlayerActivityLog_action_createdAt_idx" ON "PlayerActivityLog"("action", "createdAt");
