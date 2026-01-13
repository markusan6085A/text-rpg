import { SkillDefinition } from "../../../types";

// Soul Shield - buff skill that temporarily increases defense
export const skill_1010: SkillDefinition = {
  id: 1010,
  code: "OM_1010",
  name: "Soul Shield",
  description: "Temporarily increases defense. Effect 1.\n\nВременно увеличивает защиту на 8%.",
  icon: "/skills/skill1010.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 2.5,
  cooldown: 5,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "pDef", mode: "percent", value: 8 },
  ],
  levels: [
    { level: 1, requiredLevel: 7, spCost: 520, mpCost: 10, power: 8 },
  ],
};

