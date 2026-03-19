/**
 * Пасивні ефекти від каменів з ЛС (hasLSPassive) — тільки коли камінь в інвентарі.
 * Камінь на складі — пасивка не працює.
 */
import type { CombatStats } from "./calcCombatStats";
import type { Resources } from "./calcResources";
import { itemsDB } from "../../data/items/itemsDB";
import { itemsDBCrystals } from "../../data/items/itemsDB_crystals";

const STONE_IDS = new Set([
  "stone_crit", "stone_mcrit", "stone_maxhp", "stone_focus", "stone_lifesteal",
  "stone_guidance", "stone_empower", "stone_acumen", "stone_anger", "stone_atkspd",
]);

export function applyPassiveStoneStatsToCombat(
  combatStats: CombatStats,
  inventory: Array<{ id: string; meta?: { hasLSPassive?: boolean } }>
): CombatStats {
  let result = { ...combatStats };
  const inv = Array.isArray(inventory) ? inventory : [];

  for (const item of inv) {
    if (!item?.id || !STONE_IDS.has(item.id) || !item.meta?.hasLSPassive) continue;
    const def = itemsDBCrystals[item.id] ?? itemsDB[item.id];
    if (!def?.stats) continue;

    const s = def.stats;
    // luckyStrike = крит % (1% = 10 flat)
    if (s.luckyStrike) result.crit += (s.luckyStrike as number) * 10;
    if (s.mCrit) result.mCrit += (s.mCrit as number) * 10;
    if (s.focus) result.castSpeed += Math.round(result.castSpeed * ((s.focus as number) / 100)); // -5% перезарядка
    if (s.acumen) result.castSpeed += Math.round(result.castSpeed * ((s.acumen as number) / 100)); // +5% швидкість касту
    if (s.lifeSteal) result.hpRegen += (s.lifeSteal as number) * 2;
    if (s.guidance) result.mpRegen += (s.guidance as number) * 2;
    if (s.empower) {
      result.pAtk = Math.round(result.pAtk * (1 + (s.empower as number) / 100));
      result.mAtk = Math.round(result.mAtk * (1 + (s.empower as number) / 100));
    }
    if (s.anger) result.critPower += (s.anger as number) * 10;
    if (s.attackSpeed) result.attackSpeed += Math.round(result.attackSpeed * ((s.attackSpeed as number) / 100));
  }

  return result;
}

export function applyPassiveStoneStatsToResources(
  resources: Resources,
  inventory: Array<{ id: string; meta?: { hasLSPassive?: boolean } }>
): Resources {
  let maxHpBonus = 0;
  const inv = Array.isArray(inventory) ? inventory : [];

  for (const item of inv) {
    if (!item?.id || !STONE_IDS.has(item.id) || !item.meta?.hasLSPassive) continue;
    const def = itemsDBCrystals[item.id] ?? itemsDB[item.id];
    if (!def?.stats?.maxHpPercent) continue;
    maxHpBonus += def.stats.maxHpPercent as number;
  }

  if (maxHpBonus <= 0) return resources;
  return {
    ...resources,
    maxHp: Math.round(resources.maxHp * (1 + maxHpBonus / 100)),
  };
}
