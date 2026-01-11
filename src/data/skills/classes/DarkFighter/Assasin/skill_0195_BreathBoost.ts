import { SkillDefinition } from "../../../types";

// Breath Boost - increases lung capacity
export const skill_0195_BreathBoost: SkillDefinition = {
  id: 195,
  code: "AS_0195_BB",
  name: "Breath Boost",
  description: "Increases lung capacity.\n\nУвеличивает емкость легких на 180 единиц.",
  icon: "/skills/skill0195.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "breathGauge", mode: "flat", value: 180 },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2800, mpCost: 0, power: 180 }, // Increases lung capacity by 180
  ],
};

