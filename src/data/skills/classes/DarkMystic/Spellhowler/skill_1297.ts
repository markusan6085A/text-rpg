import { SkillDefinition } from "../../../types";

// Clear Mind - 6 levels from XML (passive)
// regMp-Walk: 3.2, 4.0, 4.3, 5.1, 5.8, 6.2
// regMp-Stand: 2.6, 3.2, 3.5, 4.1, 4.7, 4.9
const regMpWalk = [3.2, 4.0, 4.3, 5.1, 5.8, 6.2];
const regMpStand = [2.6, 3.2, 3.5, 4.1, 4.7, 4.9];

export const skill_1297: SkillDefinition = {
  id: 1297,
  code: "SP_1297",
  name: "Clear Mind",
  description: "Enhances MP regeneration while standing or walking.\n\nУвеличивает регенерацию MP при стоянии и ходьбе.",
  icon: "/skills/skill1297.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "mpRegen", mode: "flat" }, // Value from level.power (walk regen)
    // Stand regen is handled separately in game logic
  ],
  levels: regMpWalk.map((walkRegen, index) => ({
    level: index + 1,
    requiredLevel: index < 1 ? 40 : index < 2 ? 48 : index < 3 ? 56 : index < 4 ? 60 : index < 5 ? 64 : 68,
    spCost: index < 1 ? 30000 : index < 2 ? 60000 : index < 3 ? 95000 : index < 4 ? 110000 : index < 5 ? 130000 : 150000,
    mpCost: 0,
    power: walkRegen, // Store walk regen in power, stand regen in a separate property if needed
  })),
};

