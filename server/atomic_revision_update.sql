-- ============================================
-- Атомарний UPDATE з перевіркою ревізії для optimistic locking
-- Використовується в server/src/characters.ts для PUT /characters/:id
-- ============================================
--
-- ЦЕ ПРИКЛАД для тестування в Supabase SQL Editor
-- Замініть значення на реальні перед виконанням!
--
-- В реальному коді це виконується через Prisma транзакцію з параметрами

-- ============================================
-- КРОК 1: Перевірка поточного стану (опціонально)
-- ============================================
SELECT 
  "id",
  "name",
  "accountId",
  ("heroJson"->>'heroRevision')::bigint as current_revision,
  ("heroJson"->>'heroJsonVersion')::int as json_version,
  "updatedAt"
FROM "Character"
WHERE "id" = 'character_id_here'  -- ЗАМІНІТЬ на реальний ID
LIMIT 1;

-- ============================================
-- КРОК 2: Атомарний UPDATE з умовою на ревізію
-- ============================================
-- Це основний запит - він атомарно перевіряє ревізію і оновлює дані
-- Якщо ревізія не збігається - UPDATE не виконається (0 рядків)

UPDATE "Character"
SET 
  "heroJson" = '{"name":"TestName","race":"human","classId":"warrior","level":10,"exp":1000,"heroRevision":1737400500000,"heroJsonVersion":1}'::jsonb,
  "level" = 10,
  "exp" = 1000::bigint,
  "sp" = 50,
  "adena" = 5000,
  "aa" = 0,
  "coinLuck" = 0,
  "lastActivityAt" = NOW(),
  "updatedAt" = NOW()
WHERE "id" = 'character_id_here'  -- ЗАМІНІТЬ на реальний ID
  AND "accountId" = 'account_id_here'  -- ЗАМІНІТЬ на реальний accountId
  AND ("heroJson"->>'heroRevision')::bigint = 1234567890;  -- ЗАМІНІТЬ на expectedRevision

-- ============================================
-- РЕЗУЛЬТАТ:
-- ============================================
-- Якщо повернуло "UPDATE 1" → успіх, ревізія збігалася
-- Якщо повернуло "UPDATE 0" → ревізія НЕ збігалася (конфлікт)

-- ============================================
-- КРОК 3: Перевірка результату (опціонально)
-- ============================================
SELECT 
  "id",
  "name",
  ("heroJson"->>'heroRevision')::bigint as new_revision,
  ("heroJson"->>'heroJsonVersion')::int as json_version,
  "updatedAt"
FROM "Character"
WHERE "id" = 'character_id_here'  -- ЗАМІНІТЬ на реальний ID
LIMIT 1;

-- ============================================
-- ПРИМІТКИ:
-- ============================================
-- 1. В реальному коді це виконується в транзакції з SELECT FOR UPDATE
-- 2. Параметри передаються через $1, $2, $3... (безпечно від SQL injection)
-- 3. Якщо UPDATE повернув 0 рядків → сервер повертає 409 Conflict
-- 4. Якщо UPDATE повернув 1 рядок → сервер повертає 200 OK з оновленими даними
