-- Optimize chat index for faster ORDER BY createdAt DESC
-- Run this in Supabase SQL Editor to improve chat loading speed from ~1.2s to ~50-150ms
-- 
-- ВАЖЛИВО: Таблиця називається "ChatMessage" (з великої літери), не "messages"!

-- 1. Перевірити, чи є індекс зараз
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'ChatMessage'
ORDER BY indexname;

-- 2. Видалити старий індекс (якщо є)
DROP INDEX IF EXISTS "ChatMessage_channel_createdAt_idx";

-- 3. Створити оптимізований індекс з DESC для ORDER BY createdAt DESC
CREATE INDEX "ChatMessage_channel_createdAt_idx" 
ON "ChatMessage"("channel", "createdAt" DESC);

-- 4. Перевірити, що індекс створений
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'ChatMessage' 
AND indexname = 'ChatMessage_channel_createdAt_idx';

-- 5. Перевірити, чи індекс використовується (опціонально)
-- EXPLAIN ANALYZE
-- SELECT * FROM "ChatMessage" 
-- WHERE channel = 'general' 
-- ORDER BY "createdAt" DESC 
-- LIMIT 20;
