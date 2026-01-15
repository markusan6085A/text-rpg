-- SQL script to create Letter table
-- Run this in Supabase SQL Editor to create the Letter table for the mail system

-- Create Letter table
CREATE TABLE IF NOT EXISTS "Letter" (
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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "Letter_toCharacterId_isRead_createdAt_idx" ON "Letter"("toCharacterId", "isRead", "createdAt");
CREATE INDEX IF NOT EXISTS "Letter_fromCharacterId_idx" ON "Letter"("fromCharacterId");

-- Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Letter_fromCharacterId_fkey'
    ) THEN
        ALTER TABLE "Letter" ADD CONSTRAINT "Letter_fromCharacterId_fkey" 
            FOREIGN KEY ("fromCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Letter_toCharacterId_fkey'
    ) THEN
        ALTER TABLE "Letter" ADD CONSTRAINT "Letter_toCharacterId_fkey" 
            FOREIGN KEY ("toCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Verify the table was created
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'Letter'
ORDER BY ordinal_position;
