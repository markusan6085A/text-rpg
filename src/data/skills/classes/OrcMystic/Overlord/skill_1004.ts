import { SkillDefinition } from "../../../types";

// Wisdom of Paagrio - buff skill that temporarily increases alliance members' Casting Spd.
export const skill_1004: SkillDefinition = {
  id: 1004,
  code: "OL_1004",
  name: "Wisdom of Paagrio",
  description: "Temporarily increases alliance members' Casting Spd. Effect 1-2.\n\nВременно увеличивает скорость чтения заклинаний членов альянса на 15-23%.",
  icon: "/skills/skill1004.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "wisdom_paagrio", // Unique stackType - different Paagrio buffs stack, but same buff levels replace
  effects: [
    { stat: "castSpeed", mode: "percent", value: 15 },
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 22000, mpCost: 139, power: 15 },
    { level: 2, requiredLevel: 48, spCost: 40000, mpCost: 172, power: 23 },
  ],
};

