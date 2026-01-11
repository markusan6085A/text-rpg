import type { SkillDefinition, SkillLevelDefinition } from "./types";
import type { SkillHero } from "./applySkillEffect";
import type { SkillTrigger } from "./types/triggers";
import { computeLandRate } from "./calculate/landRate";

function applyModifiersWithChance(hero: SkillHero, mod, skill: SkillDefinition, level: SkillLevelDefinition) {
  const stat = mod.stat;
  const modValue = mod.value ?? level.power;
  const current = hero[stat] ?? 0;
  const baseChance = mod.chance ?? skill.chance ?? 100;
  const resistStat = mod.resistStat ?? ("debuffResist" as keyof typeof hero);
  const resistValue = (hero[resistStat] as number | undefined) ?? 0;
  const finalChance = computeLandRate(baseChance, resistValue);
  const landed = Math.random() * 100 < finalChance;
  if (!landed) return;

  if (mod.mode === "percent") {
    hero[stat] = current * (1 + modValue / 100);
  }

  if (mod.mode === "flat") {
    hero[stat] = current + modValue;
  }

  if (mod.mode === "multiplier") {
    hero[stat] = current * modValue;
  }
}

export function fireSkillTriggers(
  event: SkillTrigger["event"],
  caster: SkillHero,
  targets: SkillHero[],
  skill: SkillDefinition,
  level: SkillLevelDefinition
) {
  if (!skill.triggers || !skill.triggers.length) return;

  skill.triggers
    .filter((t) => t.event === event)
    .forEach((trigger) => {
      const target = trigger.target ?? "self";
      const scope = trigger.scope ?? "single";
      const effectiveTargets =
        scope === "single"
          ? (target === "self" ? [caster] : targets.slice(0, 1))
          : targets.length
          ? targets
          : [caster];

      effectiveTargets.forEach((hero) => {
        trigger.effects.forEach((mod) => {
          applyModifiersWithChance(hero, mod, skill, level);
        });
      });
    });
}
