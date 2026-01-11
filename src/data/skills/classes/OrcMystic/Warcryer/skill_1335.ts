import { SkillDefinition } from "../../../types";

// Chant of Fortitude - buff skill that temporarily increases party members' defense
// WC_DEF: lvl 64
export const skill_1335: SkillDefinition = {
  id: 1335, // Конфлікт з Mass Resurrection (HumanMystic/Cardinal) - вирішується через фільтрацію в getSkillsForProfession
  code: "WC_1335",
  name: "Chant of Fortitude",
  description: "Temporarily increases party members' defense. Effect 1.\n\nВременно увеличивает физическую защиту членов группы на 30% та магическую защиту на 25%.",
  icon: "/skills/skill1335.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 70, // 70s згідно зі специфікацією
  duration: 60, // 60s згідно зі специфікацією
  buffGroup: "WC_DEF", // WC_DEF група - замінює інші WC_DEF бафи
  stackType: "chant_fortitude", // Unique stackType - different levels replace each other
  effects: [
    { stat: "pDef", mode: "percent", value: 30 }, // 30% згідно зі специфікацією
    { stat: "mDef", mode: "percent", value: 25 }, // 25% згідно зі специфікацією
  ],
  levels: [
    { level: 1, requiredLevel: 64, spCost: 320000, mpCost: 237, power: 30 },
  ],
};

