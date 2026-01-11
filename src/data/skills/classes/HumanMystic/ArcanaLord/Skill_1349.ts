import { SkillDefinition } from "../../../types";

// Final Servitor
export const skill_1349: SkillDefinition = {
  id: 1349,
  code: "AL_1349",
  name: "Final Servitor",
  description: "The spirit of an ancient hero takes possession of the servitor for a certain period of time. Consumes 20 spirit ores.",
  category: "buff",
  powerType: "none",
  icon: "/skills/skill1349.gif",
  target: "ally",
  scope: "single",
  duration: 300,
  effects: [
    { stat: "maxHp", mode: "percent", value: 20 },
    { stat: "runSpeed", mode: "percent", value: -20 },
    { stat: "accuracy", mode: "flat", value: 4 },
    { stat: "pDef", mode: "percent", value: 20 },
    { stat: "pAtk", mode: "percent", value: 10 },
    { stat: "atkSpeed", mode: "percent", value: 20 },
    { stat: "critRate", mode: "percent", value: 20 },
    { stat: "critDamage", mode: "percent", value: 20 },
    { stat: "mDef", mode: "percent", value: 20 },
    { stat: "mAtk", mode: "percent", value: 20 },
    { stat: "castSpeed", mode: "percent", value: 20 },
    { stat: "debuffResist", mode: "percent", value: 20 },
  ],
  levels: [{ level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 72, power: 0 }],
};

