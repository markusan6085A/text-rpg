import { SkillDefinition } from "../../../types";

export const skill_0116: SkillDefinition = {
  id: 116,
  code: "WL_0116",
  name: "Howl",
  description: "Instantly reduces P. Atk. of surrounding enemies.\n\nМгновенно снижает физ. атаку окружающих врагов на 23% на 15 сек. Каст: 1.2 сек. Перезарядка: 8 сек.",
  category: "debuff",
  powerType: "percent",
  target: "enemy",
  scope: "area",
  castTime: 1.2,
  cooldown: 8,
  icon: "/skills/skill0116.gif",
  levels: [
    { level: 1, requiredLevel: 43, spCost: 46000, mpCost: 29, power: 23 },
    { level: 2, requiredLevel: 46, spCost: 55000, mpCost: 31, power: 23 },
    { level: 3, requiredLevel: 49, spCost: 89000, mpCost: 33, power: 23 },
    { level: 4, requiredLevel: 52, spCost: 150000, mpCost: 35, power: 23 },
    { level: 5, requiredLevel: 55, spCost: 180000, mpCost: 38, power: 23 },
    { level: 6, requiredLevel: 58, spCost: 210000, mpCost: 40, power: 23 },
    { level: 7, requiredLevel: 60, spCost: 320000, mpCost: 42, power: 23 },
    { level: 8, requiredLevel: 62, spCost: 400000, mpCost: 43, power: 23 },
    { level: 9, requiredLevel: 64, spCost: 530000, mpCost: 45, power: 23 },
    { level: 10, requiredLevel: 66, spCost: 700000, mpCost: 46, power: 23 },
    { level: 11, requiredLevel: 68, spCost: 780000, mpCost: 48, power: 23 },
    { level: 12, requiredLevel: 70, spCost: 850000, mpCost: 53, power: 23 },
    { level: 13, requiredLevel: 72, spCost: 1700000, mpCost: 50, power: 23 },
    { level: 14, requiredLevel: 74, spCost: 2100000, mpCost: 51, power: 23 },
  ],
};

