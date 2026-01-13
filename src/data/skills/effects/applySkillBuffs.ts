export function applySkillBuffs(caster, targets, skill, level) {
  const applyTo = targets.length ? targets : [caster];
  const modifiers = skill.effects && skill.effects.length ? skill.effects : undefined;

  applyTo.forEach((hero) => {
    if (modifiers) {
      modifiers.forEach((mod) => {
        const stat = mod.stat === "attackSpeed" ? "atkSpeed" : mod.stat;
        const modValue = mod.value ?? level.power;
        const current = hero[stat] ?? 0;

        if (mod.mode === "percent") {
          // If stat is unset/zero (e.g., critDamage starts at 0), treat percent as additive baseline.
          hero[stat] = current ? current * (1 + modValue / 100) : modValue;
        }

        if (mod.mode === "flat") {
          hero[stat] = current + modValue;
        }

        if (mod.mode === "multiplier") {
          // Для multiplier використовуємо mod.multiplier якщо є, інакше розраховуємо з level.power
          let multiplier;
          if (mod.multiplier !== undefined) {
            multiplier = mod.multiplier;
          } else if (level.power !== undefined && !isNaN(level.power)) {
            // Якщо powerType === "multiplier" і power >= 1, використовуємо power напряму як множник
            // Інакше інтерпретуємо як відсоток: 1 + power/100
            if (skill.powerType === "multiplier" && level.power >= 1) {
              multiplier = level.power; // Готовий множник (наприклад, 1.12 = 12% збільшення)
            } else {
              multiplier = 1 + level.power / 100; // Відсоток (наприклад, 12 = 12% збільшення)
            }
          } else {
            multiplier = 1;
          }
          hero[stat] = current * multiplier;
          
          // 🔍 ДІАГНОСТИКА для Rapid Shot
          if (skill.id === 99) {
            console.log(`[applySkillBuffs] Rapid Shot multiplier applied:`, {
              stat,
              current,
              multiplier,
              levelPower: level.power,
              newValue: hero[stat],
              levelNumber: level.level,
            });
          }
        }
      });
      return;
    }

    // Fallback   
    if (skill.powerType === "percent") {
      hero.pAtk *= 1 + level.power / 100;
    }

    if (skill.powerType === "flat") {
      hero.pAtk += level.power;
    }
  });
}
