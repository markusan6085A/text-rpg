import { SkillDefinition } from "../../../types";

// Eye of Paagrio - buff skill that temporarily increases alliance members' critical power
export const skill_1364: SkillDefinition = {
  id: 1364,
  code: "DOM_1364",
  name: "Eye of Paagrio",
  description: "Temporarily increases alliance members' critical power. Effect 3.\n\nВременно увеличивает критическую силу членов альянса на 50%.",
  icon: "/skills/skill1364.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "eye_paagrio", // Unique stackType - different Paagrio buffs stack, but same buff levels replace
  effects: [
    { stat: "critDamage", mode: "multiplier", multiplier: 1.35 }, // 35% increase = 1.35 multiplier
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 13000000, mpCost: 280, power: 35 },
  ],
};

