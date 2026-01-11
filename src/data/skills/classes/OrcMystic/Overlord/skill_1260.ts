import { SkillDefinition } from "../../../types";

// Tact of Paagrio - buff skill that temporarily increases alliance members' Evasion
export const skill_1260: SkillDefinition = {
  id: 1260,
  code: "OL_1260",
  name: "Tact of Paagrio",
  description: "Temporarily increases alliance members' Evasion. Effect 1-2.\n\nВременно увеличивает Уклонение членов альянса на 2-3.",
  icon: "/skills/skill1260.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "tact_paagrio", // Unique stackType - different Paagrio buffs stack, but same buff levels replace
  effects: [
    { stat: "evasion", mode: "flat", value: 2 },
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 22000, mpCost: 139, power: 2 },
    { level: 2, requiredLevel: 48, spCost: 40000, mpCost: 172, power: 3 },
  ],
};

