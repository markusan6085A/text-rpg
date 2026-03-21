import { MOB_HP_MULTIPLIER } from "../../data/balance";
import type { Mob } from "../../data/world/types";

/**
 * Максимум HP моба в бою: для РБ — як у даних, для звичайних — з множником балансу.
 * Те саме значення, що в startBattle / BattlePanel.
 */
export function getMobEffectiveMaxHp(mob: Pick<Mob, "hp"> & { isRaidBoss?: boolean }): number {
  const isRaidBoss = (mob as Mob & { isRaidBoss?: boolean }).isRaidBoss === true;
  const base = mob.hp ?? 1;
  return isRaidBoss ? base : Math.round(base * MOB_HP_MULTIPLIER);
}
