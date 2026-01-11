import { SkillDefinition } from "../../../types";

export const skill_1288: SkillDefinition = {
  id: 1288,
  code: "HM_1288",
  name: "Aura Symphony",
  description: "By using two types of forces, launches an attack to inflict significant damage. Power 350. Эффект Aura Symphony, кастуется на врагов, действует в пределах дальности 900: - Магическая атака силой 350. - Созданная магическая связка удаляется. - Требует наложенные на себя 2 любые Силы (Seed of...).",
  icon: "/skills/skill1288.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "area",
  castTime: 7,
  cooldown: 3600,
  levels: [
  {
    "level": 1,
    "requiredLevel": 68,
    "spCost": 430000,
    "mpCost": 250,
    "power": 350
  }
]
};
