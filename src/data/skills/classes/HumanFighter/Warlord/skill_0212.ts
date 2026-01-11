import { SkillDefinition } from "../../../types";

export const skill_0212: SkillDefinition = {
  id: 212,
  code: "WL_0212",
  name: "Fast HP Recovery",
  description: "Increases HP recovery speed.\n\nУвеличивает скорость восстановления HP на 1.7-4.0 (зависит от уровня). Пассивный навык.",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  icon: "/skills/Skill0212.gif",
  levels: [
    { level: 3, requiredLevel: 40, spCost: 39000, mpCost: 0, power: 1.7 },
    { level: 4, requiredLevel: 46, spCost: 55000, mpCost: 0, power: 2.1 },
    { level: 5, requiredLevel: 52, spCost: 150000, mpCost: 0, power: 2.6 },
    { level: 6, requiredLevel: 58, spCost: 210000, mpCost: 0, power: 2.7 },
    { level: 7, requiredLevel: 68, spCost: 780000, mpCost: 0, power: 3.4 },
    { level: 8, requiredLevel: 74, spCost: 2100000, mpCost: 0, power: 4.0 },
  ],
};

