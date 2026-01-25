-- Створити таблицю ClanWarehouse
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

-- Створити індекси
CREATE INDEX IF NOT EXISTS "ClanWarehouse_clanId_idx" ON "ClanWarehouse"("clanId");
CREATE INDEX IF NOT EXISTS "ClanWarehouse_clanId_depositedAt_idx" ON "ClanWarehouse"("clanId", "depositedAt");

-- Додати foreign key, якщо таблиця Clan існує
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ClanWarehouse_clanId_fkey'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Clan'
    ) THEN
        ALTER TABLE "ClanWarehouse" 
        ADD CONSTRAINT "ClanWarehouse_clanId_fkey" 
        FOREIGN KEY ("clanId") REFERENCES "Clan"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
