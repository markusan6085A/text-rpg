import { SkillDefinition } from "../../../types";

// Chant of Predator - buff skill that temporarily increases one's party members' critical attack rate
export const skill_1308: SkillDefinition = {
  id: 1308,
  code: "WC_1308",
  name: "Chant of Predator",
  description: "Temporarily increases one's party members' critical attack rate. Effect 1-3.\n\nВременно увеличивает шанс критической атаки членов группы на 20-30%.",
  icon: "/skills/skill1308.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "chant_predator", // Unique stackType - different levels replace each other
  effects: [
    { stat: "critRate", mode: "percent" }, // Uses level.power for value
  ],
  levels: [
    { level: 1, requiredLevel: 48, spCost: 63000, mpCost: 172, power: 20 },
    { level: 2, requiredLevel: 60, spCost: 200000, mpCost: 220, power: 25 },
    { level: 3, requiredLevel: 68, spCost: 550000, mpCost: 252, power: 30 },
  ],
};

