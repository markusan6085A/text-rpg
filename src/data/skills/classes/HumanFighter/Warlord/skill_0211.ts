import { SkillDefinition } from "../../../types";

export const skill_0211: SkillDefinition = {
  id: 211,
  code: "WL_0211",
  name: "Boost HP",
  description: "Increases one's maximum HP.\n\nУвеличивает максимальное HP на 200-480 (зависит от уровня). Пассивный навык.",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  icon: "/skills/skill0211.gif",
  levels: [
    { level: 4, requiredLevel: 43, spCost: 46000, mpCost: 0, power: 200 },
    { level: 5, requiredLevel: 49, spCost: 89000, mpCost: 0, power: 250 },
    { level: 6, requiredLevel: 55, spCost: 180000, mpCost: 0, power: 300 },
    { level: 7, requiredLevel: 62, spCost: 400000, mpCost: 0, power: 350 },
    { level: 8, requiredLevel: 66, spCost: 700000, mpCost: 0, power: 400 },
    { level: 9, requiredLevel: 70, spCost: 850000, mpCost: 0, power: 440 },
    { level: 10, requiredLevel: 74, spCost: 2100000, mpCost: 0, power: 480 },
  ],
};

