import { SkillDefinition, SkillLevelDefinition } from "./types";
import type { SkillStat } from "./types/stats";
import { applySkillBuffs } from "./effects/applySkillBuffs";
import { applySkillDebuffs } from "./effects/applySkillDebuffs";
import { applySkillToggles } from "./effects/applySkillToggles";
import { applySkillSpecial } from "./effects/applySkillSpecial";

export type SkillHero = {
  pAtk: number;
  pDef: number;
  mAtk: number;
  mDef: number;
  maxHp: number;
  maxMp: number;
  critRate: number;
  hp?: number;
  mp?: number;
  cp?: number;
} & {
  [K in SkillStat]?: number;
};

export type SkillTickEffect = {
  interval: number; // seconds
  hpPerTick?: number;
  mpPerTick?: number;
  cpPerTick?: number;
  targets: SkillHero[];
};

export type SkillApplyResult = {
  targets: SkillHero[];
  tick?: SkillTickEffect;
  tickDuration?: number; // seconds; defaults to skill.duration if set
} | void;

export function applyTickEffect(tick: SkillTickEffect) {
  tick.targets.forEach((hero) => {
    if (tick.hpPerTick) {
      const currentHp = hero.hp ?? hero.maxHp;
      hero.hp = Math.max(0, Math.min(hero.maxHp, currentHp + tick.hpPerTick));
    }
    if (tick.mpPerTick) {
      const currentMp = hero.mp ?? hero.maxMp;
      hero.mp = Math.max(0, Math.min(hero.maxMp, currentMp + tick.mpPerTick));
    }
    if (tick.cpPerTick) {
      const currentCp = hero.cp ?? 0;
      hero.cp = Math.max(0, currentCp + tick.cpPerTick);
    }
  });
}

export function applySkillEffect(
  caster: SkillHero,
  targets: SkillHero[],
  skill: SkillDefinition,
  level: SkillLevelDefinition
): SkillApplyResult {
  const categoryDefaultTarget =
    skill.category === "buff"
      ? "self"
      : skill.category === "debuff"
      ? "enemy"
      : skill.category === "physical_attack" || skill.category === "magic_attack"
      ? "enemy"
      : skill.category === "toggle" || skill.category === "passive"
      ? "self"
      : "self";

  const target = skill.target ?? categoryDefaultTarget;
  const scope =
    skill.scope ??
    (target === "party" ? "party" : target === "area" ? "area" : "single");
  const effectiveTargets =
    scope === "single" ? targets.slice(0, 1) : targets.length ? targets : [caster];

  const tickNeeded =
    skill.hpPerTick !== undefined ||
    skill.mpPerTick !== undefined ||
    skill.cpPerTick !== undefined;

  const buildTick = (): SkillTickEffect | undefined => {
    if (!tickNeeded) return undefined;
    return {
      interval: skill.tickInterval ?? 1,
      hpPerTick: skill.hpPerTick,
      mpPerTick: skill.mpPerTick,
      cpPerTick: skill.cpPerTick,
      targets: effectiveTargets,
    };
  };

  switch (skill.category) {
    case "buff":
      applySkillBuffs(caster, effectiveTargets, skill, level);
      return { targets: effectiveTargets, tick: buildTick(), tickDuration: skill.duration };

    case "passive":
      // ❌ Пасивні скіли більше НЕ обробляються тут
      // Вся логіка йде через recalculateAllStats → applySinglePassive
      // Це забезпечує відсутність мутацій hero або hero.battleStats
      return { targets: effectiveTargets, tick: buildTick(), tickDuration: skill.duration };

    case "debuff":
      applySkillDebuffs(caster, effectiveTargets, skill, level);
      return { targets: effectiveTargets, tick: buildTick(), tickDuration: skill.duration };

    case "toggle":
      applySkillToggles(caster, effectiveTargets, skill, level);
      return { targets: effectiveTargets, tick: buildTick(), tickDuration: skill.duration };

    case "special":
      applySkillSpecial(caster, effectiveTargets, skill, level);
      return { targets: effectiveTargets, tick: buildTick(), tickDuration: skill.duration };

    default:
      return;
  }
}
