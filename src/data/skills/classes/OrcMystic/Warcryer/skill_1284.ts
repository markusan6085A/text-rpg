import { SkillDefinition } from "../../../types";

// Chant of Revenge - buff skill that temporarily reflects damage received by party members back upon the enemy
export const skill_1284: SkillDefinition = {
  id: 1284,
  code: "WC_1284",
  name: "Chant of Revenge",
  description: "Temporarily reflects damage received by party members back upon the enemy. Excludes damage received from skill or remote attack. Effect 1-3.\n\nВременно отражает 10-20% полученного урона обратно врагу. Не действует на урон от навыков или дальних атак.",
  icon: "/skills/skill1284.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "chant_revenge", // Unique stackType - different levels replace each other
  effects: [
    { stat: "reflect", mode: "percent" }, // Uses level.power for value
  ],
  levels: [
    { level: 1, requiredLevel: 62, spCost: 310000, mpCost: 229, power: 10 },
    { level: 2, requiredLevel: 68, spCost: 550000, mpCost: 252, power: 15 },
    { level: 3, requiredLevel: 74, spCost: 1500000, mpCost: 272, power: 20 },
  ],
};

