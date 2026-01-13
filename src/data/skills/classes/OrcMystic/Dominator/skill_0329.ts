import { SkillDefinition } from "../../../types";

// Health - passive skill that increases resistance to Poison and Bleed
export const skill_0329: SkillDefinition = {
  id: 329,
  code: "DOM_0329",
  name: "Health",
  description: "Temporarily increases resistance to Poison and Bleed.\n\nВременно увеличивает сопротивление к яду и кровотечению на 20%.",
  icon: "/skills/skill0329.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "poisonResist", mode: "multiplier", multiplier: 0.8 }, // 20% reduction = 0.8 multiplier
    { stat: "bleedResist", mode: "multiplier", multiplier: 0.8 },
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 10000000, mpCost: 0, power: 20 },
  ],
};

