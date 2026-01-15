-- Перевірка індексу для чату
-- Виконай це в Supabase SQL Editor, щоб перевірити, чи є індекс

-- 1. Перевірити всі індекси для таблиці ChatMessage
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'ChatMessage'
ORDER BY indexname;

-- 2. Якщо індексу немає, створити його:
-- DROP INDEX IF EXISTS "ChatMessage_channel_createdAt_idx";
-- CREATE INDEX "ChatMessage_channel_createdAt_idx" 
-- ON "ChatMessage"("channel", "createdAt" DESC);

-- 3. Перевірити, чи індекс використовується в запитах:
-- EXPLAIN ANALYZE
-- SELECT * FROM "ChatMessage" 
-- WHERE channel = 'general' 
-- ORDER BY "createdAt" DESC 
-- LIMIT 20;
