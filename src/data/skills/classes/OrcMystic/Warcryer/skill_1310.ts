import { SkillDefinition } from "../../../types";

// Chant of Vampire - buff skill that allows party members to partially restore HP using damage inflicted upon the enemy
export const skill_1310: SkillDefinition = {
  id: 1310,
  code: "WC_1310",
  name: "Chant of Vampire",
  description: "For a certain time period, allows one's party members to partially restore HP using damage inflicted upon the enemy. Excludes damage from skill or remote attack. Effect 1-4.\n\nПозволяет членам группы частично восстанавливать HP за счет урона, нанесенного врагу (6-9% от урона). Не действует на урон от навыков или дальних атак.",
  icon: "/skills/skill1310.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "chant_vampire", // Unique stackType - different levels replace each other
  effects: [
    { stat: "vampirism", mode: "percent" }, // Uses level.power for value
  ],
  levels: [
    { level: 1, requiredLevel: 44, spCost: 37000, mpCost: 154, power: 6 },
    { level: 2, requiredLevel: 58, spCost: 160000, mpCost: 213, power: 7 },
    { level: 3, requiredLevel: 66, spCost: 500000, mpCost: 244, power: 8 },
    { level: 4, requiredLevel: 74, spCost: 1500000, mpCost: 272, power: 9 },
  ],
};

