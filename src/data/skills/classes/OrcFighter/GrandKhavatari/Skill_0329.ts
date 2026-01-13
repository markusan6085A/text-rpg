import { SkillDefinition } from "../../../types";

export const Skill_0329: SkillDefinition = {
  id: 329,
  code: "GK_0329",
  name: "Health",
  description: "Temporarily increases resistance to Poison and Bleed.\n\nВременно увеличивает сопротивление к яду и кровотечению.",
  icon: "/skills/skill0329.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "poisonResist", mode: "multiplier", multiplier: 0.8 },
    { stat: "bleedResist", mode: "multiplier", multiplier: 0.8 },
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 10000000, mpCost: 0, power: 0 },
  ],
};

