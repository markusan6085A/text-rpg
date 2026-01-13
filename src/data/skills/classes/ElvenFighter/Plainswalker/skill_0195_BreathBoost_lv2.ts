import { SkillDefinition } from "../../../types";

// Breath Boost - continuation (lv.2)
export const skill_0195_BreathBoost_lv2: SkillDefinition = {
  id: 195,
  code: "PW_0195_BB",
  name: "Breath Boost",
  description: "Increases lung capacity.\n\nУвеличивает емкость легких на 300 единиц.",
  icon: "/skills/skill0195.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "breathGauge", mode: "flat", value: 300 },
  ],
  levels: [
    { level: 2, requiredLevel: 55, spCost: 160000, mpCost: 0, power: 300 },
  ],
};

