import { SkillDefinition } from "../../../types";

// Chant of Fury - buff skill that temporarily increases party members' Atk. Spd.
// WC_COMBAT: замінює Courage (lvl 20)
export const skill_1251: SkillDefinition = {
  id: 1251,
  code: "WC_1251",
  name: "Chant of Fury",
  description: "Temporarily increases party members' Atk. Spd. Effect 1-2.\n\nВременно увеличивает скорость атаки членов группы на 15-33%.",
  icon: "/skills/skill1251.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 45, // 45s згідно зі специфікацією
  duration: 35, // 35s згідно зі специфікацією
  buffGroup: "WC_COMBAT", // WC_COMBAT група - замінює інші WC_COMBAT бафи
  stackType: "chant_fury", // Unique stackType - different levels replace each other
  effects: [
    { stat: "atkSpeed", mode: "multiplier" }, // Uses level.power to calculate multiplier (15% = 1.15, 33% = 1.33)
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 9000, mpCost: 40, power: 1.15 }, // lvl 20 згідно зі специфікацією
    { level: 2, requiredLevel: 56, spCost: 110000, mpCost: 204, power: 1.33 }, // 33% increase = 1.33 multiplier
  ],
};

