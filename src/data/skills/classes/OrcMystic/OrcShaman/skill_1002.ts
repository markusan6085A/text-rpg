import { SkillDefinition } from "../../../types";

// Chant of Flame - buff skill that temporarily increases party member's magic speed
export const skill_1002: SkillDefinition = {
  id: 1002,
  code: "OS_1002",
  name: "Chant of Flame",
  description: "Temporarily increases party member's magic speed. Effect 1.\n\nВременно увеличивает скорость магии членов группы на 15%.",
  icon: "/skills/skill1002.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "castSpeed", mode: "percent", value: 15 },
  ],
  levels: [
    { level: 1, requiredLevel: 30, spCost: 11000, mpCost: 105, power: 15 },
  ],
};

