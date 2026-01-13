import { SkillDefinition } from "../../../types";

// Clear Mind - enhances MP regeneration while standing or walking
export const skill_0217: SkillDefinition = {
  id: 217,
  code: "ES_0217",
  name: "Clear Mind",
  description: "Enhances MP regeneration while standing or walking.\n\nУвеличивает регенерацию MP при стоянии на 3.2-6.2 MP/сек (зависит от уровня).\nУвеличивает регенерацию MP при ходьбе на 2.6-4.9 MP/сек (зависит от уровня).",
  icon: "/skills/skill0217.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "mpRegen", mode: "flat" }, // Value from level.power (standing regen)
    // Walking regen is handled separately in game logic
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 28000, mpCost: 0, power: 3.2 }, // walking: 2.6
    { level: 2, requiredLevel: 48, spCost: 60000, mpCost: 0, power: 4.0 }, // walking: 3.2
    { level: 3, requiredLevel: 56, spCost: 95000, mpCost: 0, power: 4.3 }, // walking: 3.5
    { level: 4, requiredLevel: 62, spCost: 150000, mpCost: 0, power: 5.1 }, // walking: 4.1
    { level: 5, requiredLevel: 68, spCost: 390000, mpCost: 0, power: 5.8 }, // walking: 4.7
    { level: 6, requiredLevel: 74, spCost: 1100000, mpCost: 0, power: 6.2 }, // walking: 4.9
  ],
};

