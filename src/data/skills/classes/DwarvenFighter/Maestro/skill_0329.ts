import { SkillDefinition } from "../../../types";

// Health - increases resistance to Poison and Bleed
// XML: bleedVuln: 0.8, poisonVuln: 0.8 (20% resistance)
export const skill_0329: SkillDefinition = {
  id: 329,
  code: "MA_0329",
  name: "Health",
  description: "Temporarily increases resistance to Poison and Bleed.\n\nВременно увеличивает сопротивление к яду и кровотечению на 20%.",
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
    { level: 1, requiredLevel: 76, spCost: 15000000, mpCost: 0, power: 0 },
  ],
};

