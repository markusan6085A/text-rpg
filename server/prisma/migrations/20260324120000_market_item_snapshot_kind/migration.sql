-- Вкладка «предмети» фільтрує за itemSnapshot._marketKind === 'item'.
-- Раніше для предметів ключ не записувався; NOT coin_luck у SQL давав NULL і рядки зникали з вітрини.
UPDATE "PlayerMarketListing"
SET "itemSnapshot" = jsonb_set("itemSnapshot"::jsonb, '{_marketKind}', '"item"', true)
WHERE "itemSnapshot"->>'_marketKind' IS NULL;
