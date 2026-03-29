import { computeLandRate } from "../calculate/landRate";

export function applySkillDebuffs(caster, targets, skill, level) {
  const applyTo = targets.length ? targets : [caster];
  const modifiers = skill.effects && skill.effects.length ? skill.effects : undefined;

  applyTo.forEach((hero) => {
    if (modifiers) {
      modifiers.forEach((mod) => {
        const stat = mod.stat;
        const modValue = mod.value ?? level.power;
        const current = hero[stat] ?? 0;
        const baseChanceRaw = mod.chance ?? skill.chance ?? 100;
        const bleedFromGear = stat === "bleed" ? (caster?.bleedChanceBonus ?? 0) : 0;
        const baseChance = baseChanceRaw + bleedFromGear;
        const resistStat = mod.resistStat ?? ("debuffResist" as keyof typeof hero);
        const resistBase = (hero[resistStat] as number | undefined) ?? 0;
        const bleedResistExtra = stat === "bleed" ? (hero?.bleedResist ?? 0) : 0;
        const resistValue = resistBase + bleedResistExtra;
        const finalChance = computeLandRate(baseChance, resistValue);
        const landed = Math.random() * 100 < finalChance;
        if (!landed) {
          return;
        }

        if (mod.mode === "percent") {
          hero[stat] = current * (1 + modValue / 100);
        }

        if (mod.mode === "flat") {
          hero[stat] = current + modValue;
        }

        if (mod.mode === "multiplier") {
          hero[stat] = current * modValue;
        }
      });
      return;
    }

    console.log("Debuff applied:", skill.name);
  });
}
