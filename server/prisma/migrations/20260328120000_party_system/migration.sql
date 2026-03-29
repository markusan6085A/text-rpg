-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL,
    "leaderCharacterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartyMember" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartyInvite" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "fromCharacterId" TEXT NOT NULL,
    "toCharacterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartyInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Party_leaderCharacterId_idx" ON "Party"("leaderCharacterId");

-- CreateIndex
CREATE UNIQUE INDEX "PartyMember_characterId_key" ON "PartyMember"("characterId");

-- CreateIndex
CREATE INDEX "PartyMember_partyId_idx" ON "PartyMember"("partyId");

-- CreateIndex
CREATE INDEX "PartyInvite_toCharacterId_status_idx" ON "PartyInvite"("toCharacterId", "status");

-- CreateIndex
CREATE INDEX "PartyInvite_partyId_idx" ON "PartyInvite"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "PartyInvite_partyId_toCharacterId_key" ON "PartyInvite"("partyId", "toCharacterId");

-- AddForeignKey
ALTER TABLE "PartyMember" ADD CONSTRAINT "PartyMember_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyMember" ADD CONSTRAINT "PartyMember_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyInvite" ADD CONSTRAINT "PartyInvite_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyInvite" ADD CONSTRAINT "PartyInvite_fromCharacterId_fkey" FOREIGN KEY ("fromCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyInvite" ADD CONSTRAINT "PartyInvite_toCharacterId_fkey" FOREIGN KEY ("toCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
