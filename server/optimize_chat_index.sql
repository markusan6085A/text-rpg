-- Optimize chat index for faster ORDER BY createdAt DESC
-- Run this in Supabase SQL Editor to improve chat loading speed from ~1.2s to ~50-150ms

-- Drop old index if exists
DROP INDEX IF EXISTS "ChatMessage_channel_createdAt_idx";

-- Create optimized index with DESC for ORDER BY createdAt DESC
CREATE INDEX "ChatMessage_channel_createdAt_idx" ON "ChatMessage"("channel", "createdAt" DESC);

-- Verify index was created
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'ChatMessage' 
AND indexname = 'ChatMessage_channel_createdAt_idx';
