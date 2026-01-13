import { SkillDefinition } from "../../../types";

// Wind Strike - blasts a target with violent winds
export const skill_1177: SkillDefinition = {
  id: 1177,
  code: "EM_1177",
  name: "Wind Strike",
  description: "Blasts a target with violent winds. Power 12.\n\nОбрушивает на цель сильные ветры. Сила: 12-21 (зависит от уровня). Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/Skill1177_0.jpg",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 9, power: 12 },
    { level: 2, requiredLevel: 7, spCost: 260, mpCost: 9, power: 13 },
    { level: 3, requiredLevel: 7, spCost: 260, mpCost: 10, power: 15 },
    { level: 4, requiredLevel: 14, spCost: 1100, mpCost: 14, power: 18 },
    { level: 5, requiredLevel: 14, spCost: 1100, mpCost: 15, power: 21 },
  ],
};

