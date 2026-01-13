import { SkillDefinition } from "../../../types";

// Holy Weapon - a temporary holy enhancement of a physical attack
// З XML: levels="1", mpConsume: 23
// Для Elven Oracle: рівень 1 (requiredLevel: 25)
export const skill_1043: SkillDefinition = {
  id: 1043,
  code: "EO_1043",
  name: "Holy Weapon",
  description: "A temporary holy enhancement of a physical attack. Can be used on one's party members.\n\nВременное святое усиление физической атаки. Можно использовать на членах группы. Увеличивает физическую атаку на 10% святой стихией. Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1043.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "holyAttack", mode: "percent", value: 10 },
  ],
  levels: [
    { level: 1, requiredLevel: 25, spCost: 6500, mpCost: 23, power: 0 },
  ],
};

