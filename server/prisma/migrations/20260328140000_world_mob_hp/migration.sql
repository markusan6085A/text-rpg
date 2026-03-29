-- CreateTable
CREATE TABLE "ZoneMobHp" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "mobIndex" INTEGER NOT NULL,
    "currentHp" INTEGER NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoneMobHp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZoneMobRespawn" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "mobIndex" INTEGER NOT NULL,
    "respawnAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoneMobRespawn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ZoneMobHp_zoneId_mobIndex_key" ON "ZoneMobHp"("zoneId", "mobIndex");

-- CreateIndex
CREATE INDEX "ZoneMobHp_zoneId_idx" ON "ZoneMobHp"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "ZoneMobRespawn_zoneId_mobIndex_key" ON "ZoneMobRespawn"("zoneId", "mobIndex");

-- CreateIndex
CREATE INDEX "ZoneMobRespawn_zoneId_idx" ON "ZoneMobRespawn"("zoneId");

-- CreateIndex
CREATE INDEX "ZoneMobRespawn_respawnAt_idx" ON "ZoneMobRespawn"("respawnAt");
