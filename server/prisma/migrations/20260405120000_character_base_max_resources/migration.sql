-- AlterTable
ALTER TABLE "Character" ADD COLUMN "baseMaxHp" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Character" ADD COLUMN "baseMaxMp" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Character" ADD COLUMN "baseMaxCp" INTEGER NOT NULL DEFAULT 1;

-- Backfill from heroJson (explicit base* або max*), з безпечним парсингом чисел
UPDATE "Character"
SET
  "baseMaxHp" = GREATEST(
    1,
    LEAST(
      5000000,
      COALESCE(
        CASE
          WHEN ("heroJson"->>'baseMaxHp') ~ '^-?[0-9]+'
          THEN GREATEST(1, LEAST(5000000, FLOOR(("heroJson"->>'baseMaxHp')::numeric)::int))
        END,
        CASE
          WHEN ("heroJson"->>'maxHp') ~ '^-?[0-9]+'
          THEN GREATEST(1, LEAST(5000000, FLOOR(("heroJson"->>'maxHp')::numeric)::int))
        END,
        "baseMaxHp"
      )
    )
  ),
  "baseMaxMp" = GREATEST(
    1,
    LEAST(
      5000000,
      COALESCE(
        CASE
          WHEN ("heroJson"->>'baseMaxMp') ~ '^-?[0-9]+'
          THEN GREATEST(1, LEAST(5000000, FLOOR(("heroJson"->>'baseMaxMp')::numeric)::int))
        END,
        CASE
          WHEN ("heroJson"->>'maxMp') ~ '^-?[0-9]+'
          THEN GREATEST(1, LEAST(5000000, FLOOR(("heroJson"->>'maxMp')::numeric)::int))
        END,
        "baseMaxMp"
      )
    )
  ),
  "baseMaxCp" = GREATEST(
    1,
    LEAST(
      5000000,
      COALESCE(
        CASE
          WHEN ("heroJson"->>'baseMaxCp') ~ '^-?[0-9]+'
          THEN GREATEST(1, LEAST(5000000, FLOOR(("heroJson"->>'baseMaxCp')::numeric)::int))
        END,
        CASE
          WHEN ("heroJson"->>'maxCp') ~ '^-?[0-9]+'
          THEN GREATEST(1, LEAST(5000000, FLOOR(("heroJson"->>'maxCp')::numeric)::int))
        END,
        "baseMaxCp"
      )
    )
  );
