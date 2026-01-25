-- AlterTable: Add emblem column to Clan
ALTER TABLE "Clan" ADD COLUMN IF NOT EXISTS "emblem" TEXT;
