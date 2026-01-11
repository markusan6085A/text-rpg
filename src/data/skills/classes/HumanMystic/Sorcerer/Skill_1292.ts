import { SkillDefinition } from "../../../types";

export const skill_1292: SkillDefinition = {
  id: 1292,
  code: "HM_1292",
  name: "Elemental Assault",
  description: "Launches an attack that will inflict great damage. In order to use this skill, one will need the force of water and the force of wind. Power 500. Эффект Elemental Assault, кастуется на врагов, действует в пределах дальности 900: - Магическая атака силой 500. Возможен оверхит. - Созданная магическая связка удаляется. - Требует наложенные на себя две силы: Seed of Water и Seed of Wind.",
  icon: "/skills/skill1292.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 7,
  cooldown: 3600,
  levels: [
  {
    "level": 1,
    "requiredLevel": 72,
    "spCost": 940000,
    "mpCost": 250,
    "power": 500
  }
]
};
