import { SkillDefinition } from "../../../types";

// Health - increases resistance to Poison and Bleed
export const skill_0329: SkillDefinition = {
  id: 329,
  code: "ST_0329",
  name: "Health",
  description: "Temporarily increases resistance to Poison and Bleed.\n\nВременно увеличивает сопротивление к отравлению и кровотечению.",
  icon: "/skills/skill0329.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "poisonResist", mode: "multiplier", multiplier: 0.8 }, // 20% resistance = 0.8 vulnerability
    { stat: "bleedResist", mode: "multiplier", multiplier: 0.8 }, // 20% resistance = 0.8 vulnerability
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 10000000, mpCost: 0, power: 0 },
  ],
};

