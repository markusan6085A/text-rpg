import { SkillDefinition } from "../../../types";

// Chant of Shielding - buff skill that temporarily increases party member's defense
export const skill_1009: SkillDefinition = {
  id: 1009,
  code: "OS_1009",
  name: "Chant of Shielding",
  description: "Temporarily increases party member's defense. Effect 1.\n\nВременно увеличивает защиту членов группы на 8-12%.",
  icon: "/skills/skill1009.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "pDef", mode: "percent", value: 8 },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2900, mpCost: 77, power: 8 },
    { level: 2, requiredLevel: 30, spCost: 11000, mpCost: 105, power: 12 },
  ],
};

