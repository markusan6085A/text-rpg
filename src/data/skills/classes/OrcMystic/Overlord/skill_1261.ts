import { SkillDefinition } from "../../../types";

// Rage of Paagrio - buff skill that temporarily reduces alliance members' P. Def. and M. Def. and increases their P. Atk., M. Atk., Atk. Spd., Casting Spd. and Speed
export const skill_1261: SkillDefinition = {
  id: 1261,
  code: "OL_1261",
  name: "Rage of Paagrio",
  description: "Temporarily reduces alliance members' P. Def. and M. Def. and increases their P. Atk., M. Atk., Atk. Spd., Casting Spd. and Speed. Effect 1-2.\n\nВременно уменьшает P. Def. и M. Def. членов альянса и увеличивает их P. Atk., M. Atk., Atk. Spd., Casting Spd. и Speed.",
  icon: "/skills/skill1261.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 2.5,
  cooldown: 20,
  duration: 1200, // 20 minutes
  stackType: "rage_paagrio", // Unique stackType - different Paagrio buffs stack, but same buff levels replace
  effects: [
    { stat: "pAtk", mode: "percent", value: 5 },
    { stat: "mAtk", mode: "percent", value: 5 },
    { stat: "atkSpeed", mode: "percent", value: 5 },
    { stat: "castSpeed", mode: "percent", value: 5 },
    { stat: "runSpeed", mode: "flat", value: 5 },
    { stat: "pDef", mode: "percent", value: -5 },
    { stat: "mDef", mode: "percent", value: -10 },
  ],
  levels: [
    { level: 1, requiredLevel: 44, spCost: 28000, mpCost: 154, power: 5 },
    { level: 2, requiredLevel: 52, spCost: 65000, mpCost: 188, power: 8 },
  ],
};

