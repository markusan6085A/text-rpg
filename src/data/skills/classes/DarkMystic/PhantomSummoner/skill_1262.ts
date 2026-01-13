import { SkillDefinition } from "../../../types";

export const skill_1262: SkillDefinition = {
  id: 1262,
  code: "DMP_1262",
  name: "Transfer Pain",
  description: "Transfers part of one's damage to a servitor. MP will be consumed continuously.\n\nПередает часть урона слуге. MP потребляется непрерывно.",
  icon: "/skills/skill1262.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  duration: 3600,
  levels: [
    { level: 1, requiredLevel: 40, power: 10, mpCost: 7, spCost: 32000 },
    { level: 2, requiredLevel: 44, power: 20, mpCost: 9, spCost: 55000 },
    { level: 3, requiredLevel: 48, power: 30, mpCost: 11, spCost: 110000 },
    { level: 4, requiredLevel: 52, power: 40, mpCost: 12, spCost: 210000 },
    { level: 5, requiredLevel: 70, power: 50, mpCost: 13, spCost: 670000 },
  ],
};

