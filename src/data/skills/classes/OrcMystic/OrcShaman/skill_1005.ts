import { SkillDefinition } from "../../../types";

// Blessing of Paagrio - buff skill that temporarily increases clan member's defense
export const skill_1005: SkillDefinition = {
  id: 1005,
  code: "OS_1005",
  name: "Blessing of Paagrio",
  description: "Temporarily increases clan member's defense. Effect 1.\n\nВременно увеличивает защиту членов клана на 8%.",
  icon: "/skills/skill1005.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "blessing_paagrio", // Unique stackType - different Paagrio buffs stack, but same buff levels replace
  effects: [
    { stat: "pDef", mode: "percent", value: 8 },
  ],
  levels: [
    { level: 1, requiredLevel: 35, spCost: 18000, mpCost: 120, power: 8 },
  ],
};

