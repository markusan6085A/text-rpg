import { SkillDefinition } from "../../../types";

// Chant of Iron Will - buff skill that temporarily increases party members' defense
// WC_DEF: lvl 78
export const skill_0072: SkillDefinition = {
  id: 72,
  code: "WC_0072",
  name: "Chant of Iron Will",
  description: "Temporarily increases party members' defense. Effect 1.\n\nВременно увеличивает физическую защиту членов группы на 40% та магическую защиту на 30%.",
  icon: "/skills/skill0072.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 80, // 80s згідно зі специфікацією
  duration: 50, // 50s згідно зі специфікацією
  buffGroup: "WC_DEF", // WC_DEF група - замінює інші WC_DEF бафи
  stackType: "chant_iron_will", // Unique stackType - different levels replace each other
  effects: [
    { stat: "pDef", mode: "percent", value: 40 }, // 40% згідно зі специфікацією
    { stat: "mDef", mode: "percent", value: 30 }, // 30% згідно зі специфікацією
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 300, power: 40 },
  ],
};

