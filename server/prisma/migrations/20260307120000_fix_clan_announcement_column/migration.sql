-- Fix: column clan.announcement might be missing if 20250303 ran before Clan table existed
-- Idempotent: safe to run even if column already exists (PostgreSQL 9.6+)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Clan' AND column_name = 'announcement'
    ) THEN
        ALTER TABLE "Clan" ADD COLUMN "announcement" TEXT DEFAULT '';
    END IF;
END $$;
