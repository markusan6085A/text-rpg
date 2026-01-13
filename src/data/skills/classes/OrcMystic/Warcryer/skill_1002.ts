import { SkillDefinition } from "../../../types";

// Chant of Flame - buff skill that temporarily increases party member's magic speed
export const skill_1002: SkillDefinition = {
  id: 1002,
  code: "WC_1002",
  name: "Chant of Flame",
  description: "Temporarily increases party member's magic speed. Effect 2-3.\n\nВременно увеличивает скорость каста заклинаний членов группы на 23-30%.",
  icon: "/skills/skill1002.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "chant_flame", // Unique stackType - different levels replace each other
  effects: [
    { stat: "castSpeed", mode: "percent" }, // Uses level.power for value
  ],
  levels: [
    { level: 2, requiredLevel: 44, spCost: 37000, mpCost: 154, power: 23 },
    { level: 3, requiredLevel: 56, spCost: 110000, mpCost: 204, power: 30 },
  ],
};

