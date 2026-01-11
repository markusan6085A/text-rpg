import { SkillDefinition } from "../../../types";

// Chant of Fire - buff skill that temporarily increases party member's magic resistance
export const skill_1006: SkillDefinition = {
  id: 1006,
  code: "WC_1006",
  name: "Chant of Fire",
  description: "Temporarily increases party member's magic resistance. Effect 2-3.\n\nВременно увеличивает магическое сопротивление членов группы на 23-30%.",
  icon: "/skills/skill1006.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "chant_fire", // Unique stackType - different levels replace each other
  effects: [
    { stat: "mDef", mode: "percent" }, // Uses level.power for value
  ],
  levels: [
    { level: 2, requiredLevel: 40, spCost: 27000, mpCost: 139, power: 23 },
    { level: 3, requiredLevel: 52, spCost: 95000, mpCost: 188, power: 30 },
  ],
};

