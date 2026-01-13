import { SkillDefinition } from "../../../types";

export const Skill_0329: SkillDefinition = {
  id: 329,
  code: "DL_0329",
  name: "Health",
  description: "Temporarily increases resistance to Poison and Bleed. -\n\nВременно увеличивает сопротивление к яду и кровотечению.",
  category: "passive",
  powerType: "none",
  icon: "/skills/0329.jpg",
  effects: [
    { stat: "poisonResist", mode: "percent", value: 20 },
    { stat: "bleedResist", mode: "percent", value: 20 },
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 12000000, mpCost: 0, power: 0 },
  ],
};

