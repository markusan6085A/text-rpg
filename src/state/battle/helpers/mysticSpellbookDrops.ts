import type { Mob } from "../../../data/world/types";
import type { Hero, HeroInventoryItem } from "../../../types/Hero";
import { itemsDB } from "../../../data/items/itemsDB";
import {
  MYSTIC_SPELLBOOK_TIERS,
  mobMatchesMysticSpellbook,
} from "../../../data/spellbooks/mysticSpellbookData";
import { isMysticHero } from "../../../utils/isMysticHero";

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Максимум одна книга за вбивство; підходять моби з паттернів у даних.
 */
export function rollMysticSpellbookDropForMobKill(
  mob: Mob,
  hero: Hero
): { item: HeroInventoryItem; message: string } | null {
  if (!isMysticHero(hero)) return null;

  const pool = MYSTIC_SPELLBOOK_TIERS.filter((row) => mobMatchesMysticSpellbook(mob.id, mob.name, row));
  if (pool.length === 0) return null;

  const candidates = [...pool];
  shuffleInPlace(candidates);

  for (const row of candidates) {
    if (Math.random() >= row.dropChance) continue;
    const def = itemsDB[row.bookItemId];
    if (!def) continue;
    const item: HeroInventoryItem = {
      id: def.id,
      name: def.name,
      type: def.kind,
      slot: def.slot,
      icon: def.icon,
      description: def.description,
      count: 1,
    };
    const msg = `📕 Книга заклинания: ${def.name}`;
    return { item, message: msg };
  }
  return null;
}
