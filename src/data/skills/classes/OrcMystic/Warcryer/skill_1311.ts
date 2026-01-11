import { SkillDefinition } from "../../../types";

// Chant of Strength - buff skill that temporarily increases party members' STR
// WC_STATS: lvl 48
export const skill_1311: SkillDefinition = {
  id: 1311,
  code: "WC_1311",
  name: "Chant of Strength",
  description: "Temporarily increases party members' STR. Effect 1.\n\nВременно увеличивает STR членов группы на 3.",
  icon: "/skills/skill1311.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 70, // 70s згідно зі специфікацією
  duration: 60, // 60s згідно зі специфікацією
  buffGroup: "WC_STATS", // WC_STATS група - замінює інші WC_STATS бафи
  stackType: "chant_strength", // Unique stackType - different levels replace each other
  effects: [
    { stat: "str", mode: "flat", value: 3 }, // 3 згідно зі специфікацією
  ],
  levels: [
    { level: 1, requiredLevel: 48, spCost: 63000, mpCost: 172, power: 3 },
  ],
};

