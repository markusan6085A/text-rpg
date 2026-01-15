-- SQL script to create ChatMessage table manually in Supabase
-- Run this in Supabase SQL Editor if migration fails

CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'general',
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- Create indexes
-- Optimized index for ORDER BY createdAt DESC with channel filter
CREATE INDEX IF NOT EXISTS "ChatMessage_channel_createdAt_idx" ON "ChatMessage"("channel", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ChatMessage_characterId_idx" ON "ChatMessage"("characterId");

-- Add foreign key
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_characterId_fkey" 
    FOREIGN KEY ("characterId") REFERENCES "Character"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;
