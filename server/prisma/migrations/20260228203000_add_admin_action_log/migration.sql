-- CreateTable
CREATE TABLE "AdminActionLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminLogin" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetCharacterId" TEXT,
    "targetCharacterName" TEXT,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "AdminActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminActionLog_createdAt_idx" ON "AdminActionLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminActionLog_adminLogin_createdAt_idx" ON "AdminActionLog"("adminLogin", "createdAt");

-- CreateIndex
CREATE INDEX "AdminActionLog_action_createdAt_idx" ON "AdminActionLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AdminActionLog_targetCharacterId_createdAt_idx" ON "AdminActionLog"("targetCharacterId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminActionLog_status_createdAt_idx" ON "AdminActionLog"("status", "createdAt");
