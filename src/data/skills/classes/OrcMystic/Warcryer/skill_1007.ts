import { SkillDefinition } from "../../../types";

// Chant of Battle - buff skill that temporarily increases party member's attack power
// WC_COMBAT: замінює Fury, головний DPS-баф
export const skill_1007: SkillDefinition = {
  id: 1007,
  code: "WC_1007",
  name: "Chant of Battle",
  description: "Temporarily increases party member's attack power. Effect 3.\n\nВременно увеличивает физическую атаку членов группы на 20% та скорость атаки на 10%.",
  icon: "/skills/skill1007.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 50, // 50s згідно зі специфікацією
  duration: 45, // 45s згідно зі специфікацією
  buffGroup: "WC_COMBAT", // WC_COMBAT група - замінює інші WC_COMBAT бафи
  stackType: "chant_battle", // Unique stackType - different levels replace each other
  effects: [
    { stat: "pAtk", mode: "percent", value: 20 }, // 20% згідно зі специфікацією
    { stat: "atkSpeed", mode: "percent", value: 10 }, // 10% згідно зі специфікацією
  ],
  levels: [
    { level: 3, requiredLevel: 40, spCost: 27000, mpCost: 139, power: 20 }, // lvl 40 згідно зі специфікацією
  ],
};

