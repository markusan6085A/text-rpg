export function applySkillToggles(caster, targets, skill, level) {
  const applyTo = targets.length ? targets : [caster];
  const modifiers = skill.effects && skill.effects.length ? skill.effects : undefined;

  applyTo.forEach((hero) => {
    if (modifiers) {
      modifiers.forEach((mod) => {
        const stat = mod.stat;
        const modValue = mod.value ?? level.power;
        const current = hero[stat] ?? 0;

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

    console.log("Toggle stance:", skill.name);
  });
}
