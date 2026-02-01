-- CreateTable: SevenSealsScore
CREATE TABLE IF NOT EXISTS "SevenSealsScore" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "seal" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SevenSealsScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SevenSealsScore_characterId_key" ON "SevenSealsScore"("characterId");
CREATE INDEX IF NOT EXISTS "SevenSealsScore_points_idx" ON "SevenSealsScore"("points");
