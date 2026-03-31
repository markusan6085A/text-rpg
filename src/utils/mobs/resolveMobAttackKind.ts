import type { Mob } from "../../data/world/types";

export type MobAttackKind = "physical" | "magic";

/**
 * Тип автоатаки моба в PvE. Патрульні (aggressivePatrol) у бою — завжди фізика.
 * Явний attackType перекриває евристику. Інакше — як у PK: магія, якщо mAtk істотно вищий за pAtk.
 */
export function resolveMobAttackKind(
  mob: Mob & { attackType?: string; aggressivePatrol?: boolean }
): MobAttackKind {
  if (mob.aggressivePatrol === true) return "physical";
  const explicit = mob.attackType;
  if (explicit === "magic") return "magic";
  if (explicit === "physical") return "physical";
  const p = Number(mob.pAtk) || 0;
  const m = Number(mob.mAtk) || 0;
  if (m > p * 1.15) return "magic";
  return "physical";
}
