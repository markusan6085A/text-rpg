import { SkillDefinition } from "../../../types";

// Glory of Paagrio - buff skill that temporarily increases alliance members' M. Def.
export const skill_1008: SkillDefinition = {
  id: 1008,
  code: "OL_1008",
  name: "Glory of Paagrio",
  description: "Temporarily increases alliance members' M. Def. Effect 1-2.\n\nВременно увеличивает магическую защиту членов альянса на 15-23%.",
  icon: "/skills/skill1008.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "glory_paagrio", // Unique stackType - different Paagrio buffs stack, but same buff levels replace
  effects: [
    { stat: "mDef", mode: "percent", value: 15 },
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 22000, mpCost: 139, power: 15 },
    { level: 2, requiredLevel: 48, spCost: 40000, mpCost: 172, power: 23 },
  ],
};

