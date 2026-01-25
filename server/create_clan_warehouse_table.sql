-- CreateTable: ClanWarehouse
CREATE TABLE IF NOT EXISTS "ClanWarehouse" (
    "id" TEXT NOT NULL,
    "clanId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "depositedBy" TEXT,
    "depositedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClanWarehouse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ClanWarehouse_clanId_idx" ON "ClanWarehouse"("clanId");
CREATE INDEX IF NOT EXISTS "ClanWarehouse_clanId_depositedAt_idx" ON "ClanWarehouse"("clanId", "depositedAt");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ClanWarehouse_clanId_fkey'
    ) THEN
        ALTER TABLE "ClanWarehouse" ADD CONSTRAINT "ClanWarehouse_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
