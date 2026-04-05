-- Nuclear cleanup: персонаж Existence (ID з репорту користувача).
-- Base caps без battle бафів. У snapshot maxHp/baseMaxHp/unbuffed однакові (контракт API + inject):
-- бафнутий максимум (~10198 для Bless +35%) рахує клієнт з heroBuffs, не зберігають у maxHp рядка.
--
-- Виконати: psql $DATABASE_URL -f manual-fix-existence-base-caps.sql
-- або в Prisma Studio / Raw query.

UPDATE "Character"
SET
  "baseMaxHp" = 7554,
  "baseMaxMp" = 780,
  "baseMaxCp" = 3792,
  "heroJson" = COALESCE("heroJson"::jsonb, '{}'::jsonb)
    || jsonb_build_object(
      'baseMaxHp', 7554,
      'baseMaxMp', 780,
      'baseMaxCp', 3792,
      'maxHp', 7554,
      'maxMp', 780,
      'maxCp', 3792
    )
WHERE id = 'cmldrjv0n001fya3wym7r5cq1';
