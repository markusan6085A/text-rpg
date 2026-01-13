import { SkillDefinition } from "../../../types";

// Chant of Endurance - buff skill that temporarily increases party member's defense
// WC_DEF: стакається з Courage (lvl 10)
export const skill_1010: SkillDefinition = {
  id: 1010,
  code: "WC_1010",
  name: "Chant of Endurance",
  description: "Temporarily increases party member's defense. Effect 1.\n\nВременно увеличивает физическую защиту членов группы на 15%.",
  icon: "/skills/skill1010.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 45, // 45s згідно зі специфікацією
  duration: 30, // 30s згідно зі специфікацією
  buffGroup: "WC_DEF", // WC_DEF група - замінює інші WC_DEF бафи
  stackType: "chant_endurance", // Unique stackType - different levels replace each other
  effects: [
    { stat: "pDef", mode: "percent", value: 15 }, // 15% згідно зі специфікацією
  ],
  levels: [
    { level: 1, requiredLevel: 10, spCost: 2000, mpCost: 30, power: 15 },
  ],
};

