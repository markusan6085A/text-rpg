-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'general',
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Letter" (
    "id" TEXT NOT NULL,
    "fromCharacterId" TEXT NOT NULL,
    "toCharacterId" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Letter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SevenSealsMedal" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SevenSealsMedal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatMessage_channel_createdAt_idx" ON "ChatMessage"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_characterId_idx" ON "ChatMessage"("characterId");

-- CreateIndex
CREATE INDEX "Letter_toCharacterId_isRead_createdAt_idx" ON "Letter"("toCharacterId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Letter_fromCharacterId_idx" ON "Letter"("fromCharacterId");

-- CreateIndex
CREATE INDEX "Letter_fromCharacterId_toCharacterId_createdAt_idx" ON "Letter"("fromCharacterId", "toCharacterId", "createdAt");

-- CreateIndex
CREATE INDEX "Letter_toCharacterId_fromCharacterId_createdAt_idx" ON "Letter"("toCharacterId", "fromCharacterId", "createdAt");

-- CreateIndex
CREATE INDEX "SevenSealsMedal_characterId_weekStart_idx" ON "SevenSealsMedal"("characterId", "weekStart");

-- CreateIndex
CREATE INDEX "SevenSealsMedal_weekStart_idx" ON "SevenSealsMedal"("weekStart");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_fromCharacterId_fkey" FOREIGN KEY ("fromCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_toCharacterId_fkey" FOREIGN KEY ("toCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SevenSealsMedal" ADD CONSTRAINT "SevenSealsMedal_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Додати lastActivityAt до Character (якщо ще немає)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Character' AND column_name = 'lastActivityAt'
    ) THEN
        ALTER TABLE "Character" ADD COLUMN "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- CreateIndex: Додати індекс для lastActivityAt (якщо ще немає)
CREATE INDEX IF NOT EXISTS "Character_lastActivityAt_idx" ON "Character"("lastActivityAt");
