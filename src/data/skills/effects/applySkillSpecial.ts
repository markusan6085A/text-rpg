export function applySkillSpecial(caster, targets, skill, level) {
  const applyTo = targets.length ? targets : [caster];
  applyTo.forEach(() => {
    console.log("Special effect:", skill.name);
  });
}
