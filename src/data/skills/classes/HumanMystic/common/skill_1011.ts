import { SkillDefinition } from "../../../types";

export const skill_1011: SkillDefinition = {
  id: 1011,
  code: "HM_1011",
  name: "Heal",
  description: "Recovers HP. Power 49.\n\nВосстанавливает HP. Сила: 50-301 (зависит от уровня). Каст: 5 сек. Перезарядка: 10 сек.",
  icon: "/skills/Skill1011_0.jpg",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 5,
  cooldown: 10,
  levels: [
    { level: 1, requiredLevel: 7, spCost: 160, mpCost: 10, power: 50 },
    { level: 2, requiredLevel: 7, spCost: 160, mpCost: 13, power: 58 },
    { level: 3, requiredLevel: 7, spCost: 160, mpCost: 14, power: 67 },
    { level: 4, requiredLevel: 14, spCost: 700, mpCost: 17, power: 83 },
    { level: 5, requiredLevel: 14, spCost: 700, mpCost: 19, power: 95 },
    { level: 6, requiredLevel: 14, spCost: 700, mpCost: 22, power: 107 },
  ],
};

