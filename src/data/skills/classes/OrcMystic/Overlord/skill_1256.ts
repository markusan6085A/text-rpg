import { SkillDefinition } from "../../../types";

// Heart of Paagrio - buff skill that instantly boosts alliance members' HP regeneration significantly
export const skill_1256: SkillDefinition = {
  id: 1256,
  code: "OL_1256",
  name: "Heart of Paagrio",
  description: "Instantly boosts alliance members' HP regeneration significantly. Effect 6-8.\n\nМгновенно значительно увеличивает восстановление HP членов альянса (31-39 HP каждую секунду).",
  icon: "/skills/skill1256.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 900, // 15 minutes
  stackType: "heart_paagrio", // Unique stackType - different Paagrio buffs stack, but same buff levels replace
  effects: [
    { stat: "hpRegen", mode: "flat", value: 31 },
  ],
  levels: [
    { level: 1, requiredLevel: 44, spCost: 28000, mpCost: 134, power: 31 },
    { level: 2, requiredLevel: 48, spCost: 40000, mpCost: 152, power: 35 },
    { level: 3, requiredLevel: 52, spCost: 65000, mpCost: 164, power: 39 },
  ],
};

