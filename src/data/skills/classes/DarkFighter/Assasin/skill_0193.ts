import { SkillDefinition } from "../../../types";

// Critical Power - increases the power of a critical attack
export const skill_0193: SkillDefinition = {
  id: 193,
  code: "AS_0193",
  name: "Critical Power",
  description: "Increases the power of a critical attack.\n\nУвеличивает силу критической атаки.",
  icon: "/skills/skill0193.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "critDamage", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 24, spCost: 5000, mpCost: 0, power: 32 },
    { level: 2, requiredLevel: 32, spCost: 14000, mpCost: 0, power: 56 },
  ],
};

