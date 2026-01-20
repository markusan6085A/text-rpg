-- ============================================
-- Backfill heroRevision для існуючих персонажів
-- Виконайте цей скрипт в Supabase SQL Editor
-- ============================================
--
-- Цей скрипт додає heroRevision до всіх існуючих персонажів,
-- які ще не мають цього поля в heroJson

-- Крок 1: Перевірка скільки персонажів без heroRevision
SELECT 
  COUNT(*) as total_characters,
  COUNT(CASE WHEN ("heroJson"->>'heroRevision') IS NULL THEN 1 END) as without_revision,
  COUNT(CASE WHEN ("heroJson"->>'heroRevision') IS NOT NULL THEN 1 END) as with_revision
FROM "Character";

-- Крок 2: Backfill heroRevision для всіх персонажів без нього
-- Використовуємо updatedAt як базовий timestamp для ревізії
UPDATE "Character"
SET "heroJson" = jsonb_set(
  COALESCE("heroJson", '{}'::jsonb),
  '{heroRevision}',
  to_jsonb(EXTRACT(EPOCH FROM "updatedAt")::bigint * 1000)
)
WHERE ("heroJson"->>'heroRevision') IS NULL
   OR ("heroJson"->>'heroRevision') = 'null'
   OR ("heroJson"->>'heroRevision') = '';

-- Крок 3: Також додаємо heroJsonVersion якщо його немає
UPDATE "Character"
SET "heroJson" = jsonb_set(
  "heroJson",
  '{heroJsonVersion}',
  to_jsonb(1)
)
WHERE ("heroJson"->>'heroJsonVersion') IS NULL
   OR ("heroJson"->>'heroJsonVersion') = 'null'
   OR ("heroJson"->>'heroJsonVersion') = '';

-- Крок 4: Перевірка результату
SELECT 
  COUNT(*) as total_characters,
  COUNT(CASE WHEN ("heroJson"->>'heroRevision') IS NOT NULL 
             AND ("heroJson"->>'heroRevision') != 'null' 
             AND ("heroJson"->>'heroRevision') != '' 
        THEN 1 END) as with_revision,
  COUNT(CASE WHEN ("heroJson"->>'heroJsonVersion') IS NOT NULL 
             AND ("heroJson"->>'heroJsonVersion') != 'null' 
             AND ("heroJson"->>'heroJsonVersion') != '' 
        THEN 1 END) as with_version
FROM "Character";

-- Крок 5: Приклад перевірки конкретного персонажа
SELECT 
  "id",
  "name",
  ("heroJson"->>'heroRevision')::bigint as hero_revision,
  ("heroJson"->>'heroJsonVersion')::int as json_version,
  "updatedAt"
FROM "Character"
LIMIT 5;
