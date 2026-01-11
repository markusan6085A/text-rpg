import { SkillDefinition } from "../../../types";

// Shield of Paagrio - buff skill that temporarily increases alliance members' shield defense rate
export const skill_1250: SkillDefinition = {
  id: 1250,
  code: "OL_1250",
  name: "Shield of Paagrio",
  description: "Temporarily increases alliance members' shield defense rate. Effect 1-2.\n\nВременно увеличивает шанс блока щитом членов альянса на 30-40%.",
  icon: "/skills/skill1250.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "shield_paagrio", // Unique stackType - different Paagrio buffs stack, but same buff levels replace
  effects: [
    { stat: "shieldBlockRate", mode: "percent", value: 30 },
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 22000, mpCost: 139, power: 30 },
    { level: 2, requiredLevel: 48, spCost: 40000, mpCost: 172, power: 40 },
  ],
};

