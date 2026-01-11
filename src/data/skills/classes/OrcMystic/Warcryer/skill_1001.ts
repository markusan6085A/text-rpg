import { SkillDefinition } from "../../../types";

// Chant of Courage - buff skill that temporarily increases party member's attack power
// WC_COMBAT: перший бойовий баф (lvl 1)
export const skill_1001: SkillDefinition = {
  id: 1001,
  code: "WC_1001",
  name: "Chant of Courage",
  description: "Temporarily increases party member's attack power. Effect 1.\n\nВременно увеличивает физическую атаку членов группы на 10%.",
  icon: "/skills/skill1001.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 40, // 40s згідно зі специфікацією
  duration: 30, // 30s згідно зі специфікацією
  buffGroup: "WC_COMBAT", // WC_COMBAT група - замінює інші WC_COMBAT бафи
  stackType: "chant_courage", // Unique stackType - different levels replace each other
  effects: [
    { stat: "pAtk", mode: "percent", value: 10 }, // 10% згідно зі специфікацією
  ],
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 20, power: 10 },
  ],
};

