import { SkillDefinition } from "../../../types";

// Soul of Paagrio - buff skill that temporarily increases alliance members' M.Atk
export const skill_1365: SkillDefinition = {
  id: 1365,
  code: "DOM_1365",
  name: "Soul of Paagrio",
  description: "Temporarily increases alliance members' M.Atk. Effect 3.\n\nВременно увеличивает магическую атаку членов альянса на 75%.",
  icon: "/skills/skill1365.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "soul_paagrio", // Unique stackType - different Paagrio buffs stack, but same buff levels replace
  effects: [
    { stat: "mAtk", mode: "multiplier", multiplier: 1.75 }, // 75% increase = 1.75 multiplier
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 13000000, mpCost: 280, power: 75 },
  ],
};

