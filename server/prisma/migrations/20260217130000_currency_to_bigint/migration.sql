-- Fix integer overflow: adena/aa/coinLuck/coinsSilver can exceed 32-bit max (2.1B)
-- PostgreSQL INTEGER = 32-bit, BIGINT = 64-bit

ALTER TABLE "Character" ALTER COLUMN "adena" TYPE BIGINT USING "adena"::BIGINT;
ALTER TABLE "Character" ALTER COLUMN "aa" TYPE BIGINT USING "aa"::BIGINT;
ALTER TABLE "Character" ALTER COLUMN "coinLuck" TYPE BIGINT USING "coinLuck"::BIGINT;
ALTER TABLE "Character" ALTER COLUMN "coinsSilver" TYPE BIGINT USING "coinsSilver"::BIGINT;

ALTER TABLE "Clan" ALTER COLUMN "adena" TYPE BIGINT USING "adena"::BIGINT;
ALTER TABLE "Clan" ALTER COLUMN "coinLuck" TYPE BIGINT USING "coinLuck"::BIGINT;
