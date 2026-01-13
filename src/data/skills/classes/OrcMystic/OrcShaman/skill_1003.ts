import { SkillDefinition } from "../../../types";

// Power of Paagrio - buff skill that temporarily increases clan member's attack power
export const skill_1003: SkillDefinition = {
  id: 1003,
  code: "OS_1003",
  name: "Power of Paagrio",
  description: "Temporarily increases clan member's attack power. Effect 1.\n\nВременно увеличивает силу атаки членов клана на 8%.",
  icon: "/skills/skill1003.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "power_paagrio", // Unique stackType - different Paagrio buffs stack, but same buff levels replace
  effects: [
    { stat: "pAtk", mode: "percent", value: 8 },
  ],
  levels: [
    { level: 1, requiredLevel: 30, spCost: 11000, mpCost: 105, power: 8 },
  ],
};

