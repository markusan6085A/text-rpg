import type { ItemDefinition } from "./itemsDB.types";
import { MYSTIC_SPELLBOOK_TIERS } from "../spellbooks/mysticSpellbookTiers";

/**
 * Предмети-книги для гільдії магів (іконки з l2dop).
 * Лише цикл for — без Object.fromEntries(...map...): esbuild при інлайні в itemsDB
 * міг збирати вираз у const t = f(t.map(...)) і давати TDZ («cannot access before initialization»).
 */
function buildMysticSpellbookItemsDB(): Record<string, ItemDefinition> {
  const out: Record<string, ItemDefinition> = {};
  for (const tier of MYSTIC_SPELLBOOK_TIERS) {
    out[tier.bookItemId] = {
      id: tier.bookItemId,
      name: tier.bookName,
      kind: "quest",
      icon: `/items/drops/spellbooks/l2dop-by-itemid/${tier.l2ItemId}.jpg`,
      description:
        "Книга заклинання для здачі в Гільдії магів. Випадає з відповідних монстрів. Після здачі можна вивчити перший рівень скілу за SP.",
      slot: "quest",
      stackable: true,
    };
  }
  return out;
}

export const mysticSpellbookItemsDB: Record<string, ItemDefinition> = buildMysticSpellbookItemsDB();
