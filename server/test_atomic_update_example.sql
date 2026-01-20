-- ============================================
-- ПРИКЛАД: Атомарний UPDATE для тестування
-- Скопіюйте цей SQL в Supabase Editor і замініть значення
-- ============================================

-- Спочатку знайдіть реальний character ID:
SELECT "id", "name", "accountId", ("heroJson"->>'heroRevision')::bigint as revision
FROM "Character"
LIMIT 5;

-- Потім виконайте UPDATE (замініть значення на реальні):
UPDATE "Character"
SET 
  "heroJson" = jsonb_set(
    "heroJson",
    '{heroRevision}',
    to_jsonb(EXTRACT(EPOCH FROM NOW())::bigint * 1000)
  ),
  "updatedAt" = NOW()
WHERE "id" = 'ВАШ_CHARACTER_ID'
  AND "accountId" = 'ВАШ_ACCOUNT_ID'
  AND ("heroJson"->>'heroRevision')::bigint = 1234567890;  -- Поточна ревізія

-- Перевірка результату:
SELECT 
  "id",
  "name",
  ("heroJson"->>'heroRevision')::bigint as new_revision,
  "updatedAt"
FROM "Character"
WHERE "id" = 'ВАШ_CHARACTER_ID';
