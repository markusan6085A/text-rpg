import { SkillDefinition } from "../../../types";

// Chant of Eagle - buff skill that temporarily increases one's party members' Accuracy
export const skill_1309: SkillDefinition = {
  id: 1309,
  code: "WC_1309",
  name: "Chant of Eagle",
  description: "Temporarily increases one's party members' Accuracy. Effect 1-3.\n\nВременно увеличивает Точность членов группы на 2-4.",
  icon: "/skills/skill1309.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "chant_eagle", // Unique stackType - different levels replace each other
  effects: [
    { stat: "accuracy", mode: "flat" }, // Uses level.power for value
  ],
  levels: [
    { level: 1, requiredLevel: 48, spCost: 63000, mpCost: 172, power: 2 },
    { level: 2, requiredLevel: 58, spCost: 160000, mpCost: 213, power: 3 },
    { level: 3, requiredLevel: 64, spCost: 320000, mpCost: 237, power: 4 },
  ],
};

