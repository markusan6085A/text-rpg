import { SkillDefinition } from "../../../types";

export const skill_1015: SkillDefinition = {
  id: 1015,
  code: "HM_1015",
  name: "Battle Heal",
  description: "Quickly recovers HP. Power 83.\n\nБыстро восстанавливает HP. Мощность 121-301 (зависит от уровня). Каст: 2 сек. Перезарядка: 3 сек.",
  icon: "/skills/Skill1015_0.jpg",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 2,
  cooldown: 3,
  levels: [
    { level: 4, requiredLevel: 20, spCost: 1100, mpCost: 35, power: 121 },
    { level: 5, requiredLevel: 20, spCost: 1100, mpCost: 40, power: 135 },
    { level: 6, requiredLevel: 20, spCost: 1100, mpCost: 44, power: 151 },
    { level: 7, requiredLevel: 25, spCost: 2300, mpCost: 49, power: 176 },
    { level: 8, requiredLevel: 25, spCost: 2300, mpCost: 52, power: 185 },
    { level: 9, requiredLevel: 25, spCost: 2300, mpCost: 54, power: 195 },
    { level: 10, requiredLevel: 30, spCost: 4400, mpCost: 62, power: 224 },
    { level: 11, requiredLevel: 30, spCost: 4400, mpCost: 65, power: 234 },
    { level: 12, requiredLevel: 30, spCost: 4400, mpCost: 67, power: 245 },
    { level: 13, requiredLevel: 35, spCost: 7300, mpCost: 72, power: 278 },
    { level: 14, requiredLevel: 35, spCost: 7300, mpCost: 74, power: 289 },
    { level: 15, requiredLevel: 35, spCost: 7300, mpCost: 78, power: 301 },
  ],
};

