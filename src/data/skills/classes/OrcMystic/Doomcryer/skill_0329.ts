import { SkillDefinition } from "../../../types";

// Health - passive skill that increases resistance to Poison and Bleed
export const skill_0329: SkillDefinition = {
  id: 329,
  code: "DC_0329",
  name: "Health",
  description: "Temporarily increases resistance to Poison and Bleed by 20%.\n\nВременно увеличивает сопротивление к яду и кровотечению на 20%.",
  icon: "/skills/skill0329.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "poisonResist", mode: "percent", value: 20 },
    { stat: "bleedResist", mode: "percent", value: 20 },
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 15000000, mpCost: 0, power: 20 },
  ],
};

