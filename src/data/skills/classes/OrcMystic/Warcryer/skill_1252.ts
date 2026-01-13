import { SkillDefinition } from "../../../types";

// Chant of Evasion - buff skill that temporarily increases party members' Evasion
export const skill_1252: SkillDefinition = {
  id: 1252,
  code: "WC_1252",
  name: "Chant of Evasion",
  description: "Temporarily increases party members' Evasion. Effect 1-3.\n\nВременно увеличивает Уклонение членов группы на 2-4.",
  icon: "/skills/skill1252.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "chant_evasion", // Unique stackType - different levels replace each other
  effects: [
    { stat: "evasion", mode: "flat" }, // Uses level.power for value
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 27000, mpCost: 139, power: 2 },
    { level: 2, requiredLevel: 48, spCost: 63000, mpCost: 172, power: 3 },
    { level: 3, requiredLevel: 56, spCost: 110000, mpCost: 204, power: 4 },
  ],
};

