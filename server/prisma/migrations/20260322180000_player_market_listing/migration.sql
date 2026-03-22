-- CreateTable
CREATE TABLE "PlayerMarketListing" (
    "id" TEXT NOT NULL,
    "sellerCharacterId" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "itemSnapshot" JSONB NOT NULL,
    "currency" TEXT NOT NULL,
    "price" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "buyerCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "soldAt" TIMESTAMP(3),

    CONSTRAINT "PlayerMarketListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerMarketListing_status_expiresAt_idx" ON "PlayerMarketListing"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "PlayerMarketListing_sellerCharacterId_status_idx" ON "PlayerMarketListing"("sellerCharacterId", "status");

-- AddForeignKey
ALTER TABLE "PlayerMarketListing" ADD CONSTRAINT "PlayerMarketListing_sellerCharacterId_fkey" FOREIGN KEY ("sellerCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMarketListing" ADD CONSTRAINT "PlayerMarketListing_buyerCharacterId_fkey" FOREIGN KEY ("buyerCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
