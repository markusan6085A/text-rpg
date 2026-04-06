-- Add Clan.announcement
ALTER TABLE "Clan" ADD COLUMN IF NOT EXISTS "announcement" TEXT DEFAULT '';

-- CreateTable ClanInvite
CREATE TABLE IF NOT EXISTS "ClanInvite" (
    "id" TEXT NOT NULL,
    "clanId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClanInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClanInvite_clanId_characterId_key" ON "ClanInvite"("clanId", "characterId");
CREATE INDEX IF NOT EXISTS "ClanInvite_characterId_idx" ON "ClanInvite"("characterId");
CREATE INDEX IF NOT EXISTS "ClanInvite_clanId_idx" ON "ClanInvite"("clanId");

-- CreateTable ClanApplication
CREATE TABLE IF NOT EXISTS "ClanApplication" (
    "id" TEXT NOT NULL,
    "clanId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClanApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClanApplication_clanId_characterId_key" ON "ClanApplication"("clanId", "characterId");
CREATE INDEX IF NOT EXISTS "ClanApplication_characterId_idx" ON "ClanApplication"("characterId");
CREATE INDEX IF NOT EXISTS "ClanApplication_clanId_idx" ON "ClanApplication"("clanId");

-- FKs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClanInvite_clanId_fkey') THEN
        ALTER TABLE "ClanInvite" ADD CONSTRAINT "ClanInvite_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClanApplication_clanId_fkey') THEN
        ALTER TABLE "ClanApplication" ADD CONSTRAINT "ClanApplication_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
