-- SQL script to add lastActivityAt column to Character table
-- Run this in Supabase SQL Editor

-- Add lastActivityAt column with default value of now()
ALTER TABLE "Character" 
ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "Character_lastActivityAt_idx" ON "Character"("lastActivityAt");

-- Update existing characters to have lastActivityAt = updatedAt
UPDATE "Character" 
SET "lastActivityAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP)
WHERE "lastActivityAt" IS NULL;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'Character' 
AND column_name = 'lastActivityAt';
