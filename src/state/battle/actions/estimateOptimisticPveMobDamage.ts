import type { Hero } from "../../../types/Hero";
import type { BattleState } from "../types";
import type { SkillDefinition, SkillLevelDefinition } from "../../../data/skills/types";
import {
  L2_PHYSICAL_COEFFICIENT,
  L2_MAGIC_COEFFICIENT,
  L2_PVE_DAMAGE_MULTIPLIER,
} from "../../../data/balance";
import { getWeaponTypeFromEquipment } from "../../../utils/stats/applyPassiveSkills";
import { predictPveShotMultiplier } from "./useSkill/shotHelpers";

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function heroIsMageClass(hero: Hero): boolean {
  const parts = [hero.klass, hero.profession]
    .filter(Boolean)
    .map((x) => String(x).toLowerCase());
  const s = parts.join(" ");
  return (
    s.includes("mystic") ||
    s.includes("маг") ||
    s.includes("elder") ||
    s.includes("necromancer") ||
    s.includes("warlock") ||
    s.includes("prophet") ||
    s.includes("shaman")
  );
}

/** Очікуваний множник крита (середнє по шансу), узгоджено з server/pveBattle/pveDamage rollAttackDamage. */
function expectedCritMultiplier(crit: number, critPower: number, critCap = 80): number {
  const p = clamp(Number(crit) || 0, 0, critCap) / 100;
  const cp = clamp(Number(critPower) || 100, 0, 500);
  const onCrit = Math.min(3.0, 2.0 + cp / 1500);
  return (1 - p) * 1 + p * onCrit;
}

function elementMultiplier(
  element: string | undefined,
  caster: {
    fireAttack?: number;
    waterAttack?: number;
    windAttack?: number;
    earthAttack?: number;
    holyAttack?: number;
    darkAttack?: number;
  },
  target: {
    fireResist: number;
    waterResist: number;
    windResist: number;
    earthResist: number;
    holyResist: number;
    darkResist: number;
  }
): number {
  if (!element) return 1;
  const attackBonus =
    element === "fire"
      ? caster.fireAttack ?? 0
      : element === "water"
        ? caster.waterAttack ?? 0
        : element === "wind"
          ? caster.windAttack ?? 0
          : element === "earth"
            ? caster.earthAttack ?? 0
            : element === "holy"
              ? caster.holyAttack ?? 0
              : element === "dark"
                ? caster.darkAttack ?? 0
                : 0;
  const resistPenalty =
    element === "fire"
      ? target.fireResist
      : element === "water"
        ? target.waterResist
        : element === "wind"
          ? target.windResist
          : element === "earth"
            ? target.earthResist
            : element === "holy"
              ? target.holyResist
              : element === "dark"
                ? target.darkResist
                : 0;
  const resistClamped = clamp(resistPenalty, -80, 95);
  return (1 + Math.max(0, attackBonus) / 100) * (1 - resistClamped / 100);
}

/**
 * Очікуваний урон по мобу для миттєвого оновлення HP у UI (онлайн PvE); після відповіді API підставляється mobHpAfter.
 */
export function estimateOptimisticPveMobDamageDelta(args: {
  skillId: number;
  def: Pick<SkillDefinition, "category" | "element">;
  levelDef: Pick<SkillLevelDefinition, "power">;
  hero: Hero;
  heroStats: Record<string, any>;
  state: Pick<BattleState, "loadoutSlots" | "activeChargeSlots" | "zoneId">;
}): number {
  const { skillId, def, levelDef, hero, heroStats, state } = args;
  if (state.zoneId === "fishing") return 0;

  const hj = ((hero as any)?.heroJson || {}) as Record<string, any>;
  const sess = hj.battleSession;
  if (!sess || Number(sess.v) !== 1) return 0;

  const pDef = Math.max(1, Math.floor(Number(sess.mobPDef) || 1));
  const mDef = Math.max(1, Math.floor(Number(sess.mobMDef) || 1));
  const targetResists = {
    fireResist: Number(sess.fireResist) || 0,
    waterResist: Number(sess.waterResist) || 0,
    windResist: Number(sess.windResist) || 0,
    earthResist: Number(sess.earthResist) || 0,
    holyResist: Number(sess.holyResist) || 0,
    darkResist: Number(sess.darkResist) || 0,
  };

  const cs = (k: string, maxv: number) => clamp(Number(heroStats[k]) || 0, 0, maxv);

  if (skillId === 0) {
    const wtBow = getWeaponTypeFromEquipment(hero.equipment) === "bow";
    const physMult = heroIsMageClass(hero) && !wtBow ? 0.5 : 1.0;
    const shot = predictPveShotMultiplier(
      hero,
      true,
      false,
      state.loadoutSlots ?? [],
      state.activeChargeSlots ?? [],
      1
    );
    const pAtk = Math.max(1, cs("pAtk", 50000));
    const effectivePAtk = Math.max(1, pAtk * physMult * shot);
    const variance = 1.0;
    const raw =
      ((L2_PHYSICAL_COEFFICIENT * effectivePAtk) / pDef) * L2_PVE_DAMAGE_MULTIPLIER * variance;
    const critM = expectedCritMultiplier(
      Number(heroStats.crit) || 40,
      Number(heroStats.critPower) || 100,
      80
    );
    let damage = Math.max(1, Math.floor(raw * critM));
    const lsBackbiting = cs("lsBackbiting", 200);
    if (lsBackbiting > 0) damage = Math.round(damage * (1 + lsBackbiting / 100));
    return damage;
  }

  const cat = def.category;
  if (cat !== "physical_attack" && cat !== "magic_attack") return 0;

  const power = Math.max(1, Math.floor(Number(levelDef.power) || 1));
  const isPhysical = cat === "physical_attack";
  const isMagic = cat === "magic_attack";
  const shot = predictPveShotMultiplier(
    hero,
    isPhysical,
    isMagic,
    state.loadoutSlots ?? [],
    state.activeChargeSlots ?? [],
    2
  );

  if (isMagic) {
    const mAtk = Math.max(1, cs("mAtk", 50000));
    const l2Base =
      ((L2_MAGIC_COEFFICIENT * (mAtk + 2 * power)) / mDef) * L2_PVE_DAMAGE_MULTIPLIER;
    const skillBonus = 1 + cs("magicSkillPower", 500) / 100;
    const elem = elementMultiplier(def.element, {
      fireAttack: cs("fireAttack", 200),
      waterAttack: cs("waterAttack", 200),
      windAttack: cs("windAttack", 200),
      earthAttack: cs("earthAttack", 200),
      holyAttack: cs("holyAttack", 200),
      darkAttack: cs("darkAttack", 200),
    }, targetResists);
    const variance = 1.0;
    const critM = expectedCritMultiplier(
      Number(heroStats.mCrit) || 4,
      Number(heroStats.critPower) || 100,
      80
    );
    let raw = l2Base * skillBonus * elem * variance * critM;
    const lsEmpower = cs("lsEmpower", 200);
    if (lsEmpower > 0) raw *= 1 + lsEmpower / 100;
    let damage = Math.max(1, Math.round(raw));
    damage = Math.max(1, Math.round(damage * shot));
    return damage;
  }

  const pAtk = Math.max(1, cs("pAtk", 50000));
  const l2Base =
    ((L2_PHYSICAL_COEFFICIENT * (pAtk + 2 * power)) / pDef) * L2_PVE_DAMAGE_MULTIPLIER;
  const skillBonus = 1 + cs("physSkillPower", 500) / 100;
  const variance = 1.0;
  const critM = expectedCritMultiplier(
    Number(heroStats.crit) || 40,
    Number(heroStats.critPower) || 100,
    80
  );
  let raw = l2Base * skillBonus * variance * critM;
  const lsEmpower = cs("lsEmpower", 200);
  const lsBackbiting = cs("lsBackbiting", 200);
  if (lsEmpower > 0) raw *= 1 + lsEmpower / 100;
  if (lsBackbiting > 0) raw *= 1 + lsBackbiting / 100;
  let damage = Math.max(1, Math.floor(raw));
  damage = Math.max(1, Math.round(damage * shot));
  return damage;
}
