import { SkillDefinition } from "../../../types";

// Boost HP - increases maximum HP (continuation from Artisan)
// XML: #hp: 200 250 300 350 400 440 480
export const skill_0211: SkillDefinition = {
  id: 211,
  code: "WS_0211",
  name: "Boost HP",
  description: "Increases one's maximum HP.\n\nУвеличивает максимальное HP.",
  icon: "/skills/skill0211.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "maxHp", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 4, requiredLevel: 43, spCost: 46000, mpCost: 0, power: 200 },
    { level: 5, requiredLevel: 49, spCost: 110000, mpCost: 0, power: 250 },
    { level: 6, requiredLevel: 55, spCost: 250000, mpCost: 0, power: 300 },
    { level: 7, requiredLevel: 62, spCost: 400000, mpCost: 0, power: 350 },
    { level: 8, requiredLevel: 66, spCost: 780000, mpCost: 0, power: 400 },
    { level: 9, requiredLevel: 70, spCost: 850000, mpCost: 0, power: 440 },
    { level: 10, requiredLevel: 74, spCost: 2300000, mpCost: 0, power: 480 },
  ],
};

