import type { SkillDefinition, SkillLevelDefinition } from "../../data/skills/types";
import type { Hero } from "../../types/Hero";
import type { BattleState } from "./types";
import { getWeaponTypeFromEquipment } from "../../utils/stats/applyPassiveSkills";
import { getMobTargetStatsForHeroDamage } from "./helpers/mobTargetStats";
import { peekAutoShotMultiplier } from "./actions/useSkill/shotHelpers";
import {
  rollAttackDamage,
  rollBaseAutoAttackDamage,
  sanitizeCombatStats,
} from "./pveServerAlignedDamageRoll";

/** Узгоджено з server/src/pveBattle/pveVampirismSkillPercent.ts */
function pveVampirismPercentFromSkill(skillId: number): number {
  const BY_SKILL: Record<number, number> = {
    70: 20,
    289: 80,
    1090: 80,
    1147: 40,
    1234: 20,
    1245: 80,
    1343: 30,
  };
  const v = BY_SKILL[skillId];
  return typeof v === "number" && v > 0 ? v : 0;
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

export type PveOptimisticAttackPreview = {
  /** Рядки, додані на початок логу (для злиття з відповіддю сервера). */
  logLines: string[];
  nextMobHp: number;
  damage: number;
  isCrit: boolean;
};

/**
 * Локальний превью урону/логу (той самий набір формул, що PvE на сервері; окремі рандоми — reconciliation).
 */
export function computePveOptimisticAttackPreview(args: {
  skillId: number;
  def: SkillDefinition;
  levelDef: SkillLevelDefinition;
  hero: Hero;
  heroStats: Record<string, any>;
  state: BattleState;
  now: number;
}): PveOptimisticAttackPreview | null {
  const { skillId, def, levelDef, hero, heroStats, state, now } = args;
  if (state.status !== "fighting" || !state.mob) return null;

  const mobHpBefore = Math.max(0, Math.floor(Number(state.mobHP)));
  if (mobHpBefore <= 0) return null;

  const target = getMobTargetStatsForHeroDamage(state.mob, state.mobBuffs, now);
  const csStats = sanitizeCombatStats(heroStats);

  let damage = 0;
  let isCrit = false;
  let shotForLog: ReturnType<typeof peekAutoShotMultiplier> | null = null;

  if (skillId === 0) {
    const shot = peekAutoShotMultiplier(
      hero,
      true,
      false,
      state.loadoutSlots ?? [],
      state.activeChargeSlots ?? [],
      1
    );
    shotForLog = shot;
    const wtBow = getWeaponTypeFromEquipment(hero.equipment) === "bow";
    const physMult = heroIsMageClass(hero) && !wtBow ? 0.5 : 1;
    const r = rollBaseAutoAttackDamage({
      pAtk: Number(csStats.pAtk) || 1,
      targetPDef: target.pDef,
      crit: Number(csStats.crit) || 40,
      critPower: Number(csStats.critPower) || 100,
      lsBackbiting: Number(csStats.lsBackbiting) || 0,
      physicalDamageMultiplier: physMult,
      shotMultiplier: shot.multiplier,
    });
    damage = r.damage;
    isCrit = r.isCrit;
  } else {
    const cat = def.category;
    if (cat !== "physical_attack" && cat !== "magic_attack") return null;
    const isPhysical = cat === "physical_attack";
    const isMagic = cat === "magic_attack";
    const shot = peekAutoShotMultiplier(
      hero,
      isPhysical,
      isMagic,
      state.loadoutSlots ?? [],
      state.activeChargeSlots ?? [],
      2
    );
    const rolled = rollAttackDamage({
      category: cat,
      power: Math.max(1, Math.floor(Number(levelDef.power) || 1)),
      element: def.element,
      attacker: csStats,
      targetPDef: target.pDef,
      targetMDef: target.mDef,
      targetResists: {
        fireResist: target.fireResist,
        waterResist: target.waterResist,
        windResist: target.windResist,
        earthResist: target.earthResist,
        holyResist: target.holyResist,
        darkResist: target.darkResist,
      },
    });
    damage = Math.max(1, Math.round(rolled.damage * shot.multiplier));
    isCrit = rolled.isCrit;
  }

  let healVamp = 0;
  if (damage > 0) {
    const wt = getWeaponTypeFromEquipment(hero.equipment);
    const vampMeleeBonus =
      def.category === "physical_attack" && wt !== "bow"
        ? Math.max(0, Number(heroStats.vampirismMelee) || 0)
        : 0;
    const vampFromBuffs = Math.max(0, Number(heroStats.vampirism) || 0) + vampMeleeBonus;
    const vampFromSkill = pveVampirismPercentFromSkill(skillId);
    const isDrainSkill = skillId === 1090 || skillId === 1245;
    let vampPct =
      isDrainSkill && vampFromSkill > 0
        ? vampFromSkill
        : vampFromBuffs > 0
          ? vampFromBuffs
          : vampFromSkill;
    vampPct = Math.max(0, Math.min(100, vampPct));
    if (vampPct > 0) {
      healVamp = Math.round(damage * (vampPct / 100));
    }
  }

  const lines: string[] = [];
  if (skillId === 0) {
    const s = shotForLog!;
    lines.push(
      s.used ? `Автоматична атака (заряд ×${s.multiplier.toFixed(1)}).` : `Ви атакуєте.`,
      isCrit ? `Ви наносите ${damage} урону. (Крит!)` : `Ви наносите ${damage} урону.`
    );
    if (healVamp > 0) lines.push(`Відновлено ${healVamp} HP (вампіризм).`);
  } else {
    lines.push(`Ви використовуєте [${def.name}].`);
    lines.push(isCrit ? `Ви наносите ${damage} урону. (Крит!)` : `Ви наносите ${damage} урону.`);
    if (healVamp > 0) lines.push(`Відновлено ${healVamp} HP (вампіризм).`);
  }

  const nextMobHp = Math.max(0, mobHpBefore - damage);
  return {
    logLines: lines,
    nextMobHp,
    damage,
    isCrit,
  };
}
