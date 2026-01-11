import { SkillDefinition } from "../../../types";

// Chant of Shielding - buff skill that temporarily increases party member's defense
// WC_DEF: lvl 44
export const skill_1009: SkillDefinition = {
  id: 1009,
  code: "WC_1009",
  name: "Chant of Shielding",
  description: "Temporarily increases party member's defense. Effect 3.\n\nВременно увеличивает физическую защиту членов группы на 25% та магическую защиту на 15%.",
  icon: "/skills/skill1009.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 55, // 55s згідно зі специфікацією
  duration: 45, // 45s згідно зі специфікацією
  buffGroup: "WC_DEF", // WC_DEF група - замінює інші WC_DEF бафи
  stackType: "chant_shielding", // Unique stackType - different levels replace each other
  effects: [
    { stat: "pDef", mode: "percent", value: 25 }, // 25% згідно зі специфікацією
    { stat: "mDef", mode: "percent", value: 15 }, // 15% згідно зі специфікацією
  ],
  levels: [
    { level: 3, requiredLevel: 44, spCost: 37000, mpCost: 154, power: 25 },
  ],
};

