import { SkillDefinition } from "../../../types";

// Focus Mind - increases MP Recovery Speed (continuation, lv.2-6)
export const skill_0191: SkillDefinition = {
  id: 191,
  code: "SS_0191",
  name: "Focus Mind",
  description: "Increases MP Recovery Speed.\n\nУвеличивает скорость восстановления MP.",
  icon: "/skills/skill0191.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "mpRegen", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 2, requiredLevel: 43, spCost: 53000, mpCost: 0, power: 1.5 },
    { level: 3, requiredLevel: 49, spCost: 120000, mpCost: 0, power: 1.9 },
    { level: 4, requiredLevel: 55, spCost: 270000, mpCost: 0, power: 2.3 },
    { level: 5, requiredLevel: 64, spCost: 690000, mpCost: 0, power: 2.7 },
    { level: 6, requiredLevel: 72, spCost: 2200000, mpCost: 0, power: 3.1 },
  ],
};

