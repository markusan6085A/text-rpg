-- CreateTable
CREATE TABLE "AdminSignalEmailSent" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSignalEmailSent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminSignalEmailSent_characterId_signalType_key" ON "AdminSignalEmailSent"("characterId", "signalType");
