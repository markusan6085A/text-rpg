-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "characterId" TEXT,
    "characterName" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "News_createdAt_idx" ON "News"("createdAt");

-- CreateIndex
CREATE INDEX "News_type_idx" ON "News"("type");

-- CreateIndex
CREATE INDEX "News_characterId_idx" ON "News"("characterId");

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
