import { SkillDefinition } from "../../../types";

// Chant of Rage - buff skill that temporarily increases party members' critical attack
// WC_COMBAT: замінює Battle (lvl 56)
export const skill_1253: SkillDefinition = {
  id: 1253,
  code: "WC_1253",
  name: "Chant of Rage",
  description: "Temporarily increases party members' critical attack. Effect 1-3.\n\nВременно увеличивает шанс критической атаки членов группы на 15%.",
  icon: "/skills/skill1253.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 55, // 55s згідно зі специфікацією
  duration: 45, // 45s згідно зі специфікацією
  buffGroup: "WC_COMBAT", // WC_COMBAT група - замінює інші WC_COMBAT бафи
  stackType: "chant_rage", // Unique stackType - different levels replace each other
  effects: [
    { stat: "critRate", mode: "percent", value: 15 }, // 15% згідно зі специфікацією
  ],
  levels: [
    { level: 1, requiredLevel: 56, spCost: 110000, mpCost: 204, power: 15 },
  ],
};

