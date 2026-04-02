import type { Zone, Mob } from "../../data/world/types";
import { useHeroStore } from "../../state/heroStore";
import { isMobOnRespawn } from "../../state/battle/mobRespawns";
import { recalculateAllStats } from "../../utils/stats/recalculateAllStats";
import { unequipItemLogic } from "../../state/heroStore/heroInventory";
import { writeDeathGate } from "../../utils/deathGate";

export type PatrolTickCtx = { zone: Zone; start: number; visible: Mob[]; currentPage: number };

export type PatrolAggroBanner = { mobIndex: number; mobName: string; damage: number };

/** Перший видимий агро-патруль (не на респавні). */
export function findFirstAggroPatrolMob(
  ctx: PatrolTickCtx,
  heroName: string | undefined
): { mob: Mob; globalIndex: number } | null {
  if (!heroName) return null;
  for (let i = 0; i < ctx.visible.length; i++) {
    const mob = ctx.visible[i]!;
    if (!mob.aggressivePatrol) continue;
    const gi = ctx.start + i;
    if (isMobOnRespawn(ctx.zone.id, gi, heroName)) continue;
    return { mob, globalIndex: gi };
  }
  return null;
}

/**
 * Фіз. урон раз на 3 с — 100% влучання, один моб (перший агро у списку).
 * Формула як у processMobAttack для патруля: base = max(5, mobPAtk * 0.8), variance 25%.
 */
export function runAggressivePatrolHit(ctx: PatrolTickCtx): {
  banner: PatrolAggroBanner | null;
  died: boolean;
} | null {
  const h = useHeroStore.getState().hero;
  if (!h?.name || (h.hp ?? 0) <= 0) return null;
  const picked = findFirstAggroPatrolMob(ctx, h.name);
  if (!picked) return null;
  const { mob, globalIndex } = picked;
  const mobLevel = mob.level ?? 1;
  const mobPAtk = mob.pAtk ?? mobLevel * 20;
  const base = Math.max(5, mobPAtk * 0.8);
  const raw = base * (0.75 + Math.random() * 0.5);
  const pDef = h.battleStats?.pDef ?? 0;
  const dmg = Math.max(1, Math.round(raw * (100 / (100 + pDef))));
  const nextHp = Math.max(0, (h.hp ?? 0) - dmg);
  if (nextHp > 0) {
    useHeroStore.getState().updateHero({ hp: nextHp });
    return { banner: { mobIndex: globalIndex, mobName: mob.name, damage: dmg }, died: false };
  }
  const deadAt = Date.now();
  const charId = String((h as any).id ?? "").trim();
  writeDeathGate(charId || null, h.name, { killerName: mob.name, damage: dmg, at: deadAt });
  let equipmentAfter = h.equipment;
  let equipmentEnchantAfter = h.equipmentEnchantLevels;
  let zaricheUntil = h.zaricheEquippedUntil;
  if (h.equipment?.weapon === "zariche") {
    const u = unequipItemLogic(h, "weapon");
    equipmentAfter = u.equipment;
    equipmentEnchantAfter = u.equipmentEnchantLevels;
    zaricheUntil = undefined;
  }
  const heroZero = { ...h, hp: 0, maxHp: h.maxHp, equipment: equipmentAfter };
  const recalculatedDead = recalculateAllStats(heroZero, []);
  const existingJson = (h as any).heroJson || {};
  useHeroStore.getState().updateHero(
    {
      hp: 0,
      mp: 0,
      cp: 0,
      battleStats: recalculatedDead.finalStats,
      equipment: equipmentAfter,
      equipmentEnchantLevels: equipmentEnchantAfter,
      zaricheEquippedUntil: zaricheUntil,
      heroJson: {
        ...existingJson,
        heroBuffs: [],
        isDead: true,
        deadAt,
        killedByMobName: mob.name,
        killedByMobDamage: dmg,
      } as any,
    },
    { persist: true }
  );
  return { banner: null, died: true };
}
