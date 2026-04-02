import type { ItemDefinition } from "./itemsDB.types";
import { MYSTIC_SPELLBOOK_TIERS } from "../spellbooks/mysticSpellbookTiers";

/**
 * Предмети-книги для гільдії магів (іконки з l2dop).
 * Не використовувати Object.fromEntries(MYSTIC_SPELLBOOK_TIERS.map(...)) в одному const —
 * після мініфікації це дає TDZ: const e = Object.fromEntries(e.map(e => ...)) і чорний екран.
 */
const mysticSpellbookItemEntries: [string, ItemDefinition][] = MYSTIC_SPELLBOOK_TIERS.map((tier) => {
  const def: ItemDefinition = {
    id: tier.bookItemId,
    name: tier.bookName,
    kind: "quest",
    icon: `/items/drops/spellbooks/l2dop-by-itemid/${tier.l2ItemId}.jpg`,
    description:
      "Книга заклинання для здачі в Гільдії магів. Випадає з відповідних монстрів. Після здачі можна вивчити перший рівень скілу за SP.",
    slot: "quest",
    stackable: true,
  };
  return [tier.bookItemId, def];
});

export const mysticSpellbookItemsDB: Record<string, ItemDefinition> = Object.fromEntries(mysticSpellbookItemEntries);
