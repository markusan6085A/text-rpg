import type { ItemDefinition } from "./itemsDB.types";
import { MYSTIC_SPELLBOOK_TIERS } from "../spellbooks/mysticSpellbookTiers";

/** Предмети-книги для гільдії магів (іконки з l2dop). */
export const mysticSpellbookItemsDB: Record<string, ItemDefinition> = Object.fromEntries(
  MYSTIC_SPELLBOOK_TIERS.map((t) => {
    const def: ItemDefinition = {
      id: t.bookItemId,
      name: t.bookName,
      kind: "quest",
      icon: `/items/drops/spellbooks/l2dop-by-itemid/${t.l2ItemId}.jpg`,
      description:
        "Книга заклинання для здачі в Гільдії магів. Випадає з відповідних монстрів. Після здачі можна вивчити перший рівень скілу за SP.",
      slot: "quest",
      stackable: true,
    };
    return [t.bookItemId, def] as const;
  })
);
