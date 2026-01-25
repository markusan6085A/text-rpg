-- CreateTable: Clan
CREATE TABLE IF NOT EXISTS "Clan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "reputation" INTEGER NOT NULL DEFAULT 0,
    "adena" INTEGER NOT NULL DEFAULT 0,
    "coinLuck" INTEGER NOT NULL DEFAULT 0,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clan_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ClanMember
CREATE TABLE IF NOT EXISTS "ClanMember" (
    "id" TEXT NOT NULL,
    "clanId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "title" TEXT,
    "isDeputy" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClanMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ClanChat
CREATE TABLE IF NOT EXISTS "ClanChat" (
    "id" TEXT NOT NULL,
    "clanId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClanChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ClanLog
CREATE TABLE IF NOT EXISTS "ClanLog" (
    "id" TEXT NOT NULL,
    "clanId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "characterId" TEXT,
    "targetCharacterId" TEXT,
    "message" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClanLog_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX IF NOT EXISTS "Clan_name_key" ON "Clan"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Clan_creatorId_key" ON "Clan"("creatorId");
CREATE INDEX IF NOT EXISTS "Clan_creatorId_idx" ON "Clan"("creatorId");
CREATE INDEX IF NOT EXISTS "Clan_name_idx" ON "Clan"("name");

CREATE UNIQUE INDEX IF NOT EXISTS "ClanMember_characterId_key" ON "ClanMember"("characterId");
CREATE INDEX IF NOT EXISTS "ClanMember_clanId_idx" ON "ClanMember"("clanId");
CREATE INDEX IF NOT EXISTS "ClanMember_characterId_idx" ON "ClanMember"("characterId");

CREATE INDEX IF NOT EXISTS "ClanChat_clanId_createdAt_idx" ON "ClanChat"("clanId", "createdAt");
CREATE INDEX IF NOT EXISTS "ClanChat_characterId_idx" ON "ClanChat"("characterId");

CREATE INDEX IF NOT EXISTS "ClanLog_clanId_createdAt_idx" ON "ClanLog"("clanId", "createdAt");
CREATE INDEX IF NOT EXISTS "ClanLog_characterId_idx" ON "ClanLog"("characterId");

CREATE INDEX IF NOT EXISTS "ClanWarehouse_clanId_idx" ON "ClanWarehouse"("clanId");
CREATE INDEX IF NOT EXISTS "ClanWarehouse_clanId_depositedAt_idx" ON "ClanWarehouse"("clanId", "depositedAt");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Clan_creatorId_fkey'
    ) THEN
        ALTER TABLE "Clan" ADD CONSTRAINT "Clan_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ClanMember_clanId_fkey'
    ) THEN
        ALTER TABLE "ClanMember" ADD CONSTRAINT "ClanMember_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ClanMember_characterId_fkey'
    ) THEN
        ALTER TABLE "ClanMember" ADD CONSTRAINT "ClanMember_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ClanChat_clanId_fkey'
    ) THEN
        ALTER TABLE "ClanChat" ADD CONSTRAINT "ClanChat_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ClanChat_characterId_fkey'
    ) THEN
        ALTER TABLE "ClanChat" ADD CONSTRAINT "ClanChat_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ClanLog_clanId_fkey'
    ) THEN
        ALTER TABLE "ClanLog" ADD CONSTRAINT "ClanLog_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ClanLog_characterId_fkey'
    ) THEN
        ALTER TABLE "ClanLog" ADD CONSTRAINT "ClanLog_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ClanWarehouse_clanId_fkey'
    ) THEN
        ALTER TABLE "ClanWarehouse" ADD CONSTRAINT "ClanWarehouse_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
