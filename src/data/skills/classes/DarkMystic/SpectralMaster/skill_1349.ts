import { SkillDefinition } from "../../../types";

// Final Servitor
export const skill_1349: SkillDefinition = {
  id: 1349,
  code: "DMSM_1349",
  name: "Final Servitor",
  description: "The spirit of an ancient hero takes possession of the servitor for a certain period of time. Consumes 20 spirit ores.\n\nДух древнього героя оволодіває слугою на певний період часу. Потребує 20 духових руд.",
  icon: "/skills/skill1349.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 600,
  duration: 300,
  levels: [
    {
      level: 1,
      requiredLevel: 78,
      power: 0,
      mpCost: 72, // 15 + 57
      spCost: 32000000,
    },
  ],
  effects: [
    { stat: "critRate", mode: "percent", value: 20 },
    { stat: "pAtk", mode: "percent", value: 10 },
    { stat: "critDamage", mode: "percent", value: 20 },
    { stat: "atkSpeed", mode: "percent", value: 20 },
    { stat: "maxHp", mode: "percent", value: 20 },
    { stat: "runSpeed", mode: "percent", value: -20 },
    { stat: "accuracy", mode: "flat", value: 4 },
    { stat: "pDef", mode: "percent", value: 20 },
    { stat: "mDef", mode: "percent", value: 20 },
    { stat: "mAtk", mode: "percent", value: 20 },
    { stat: "castSpeed", mode: "percent", value: 20 },
    { stat: "debuffResist", mode: "percent", value: 20 }, // debuffVuln 0.8 = -20% vulnerability = +20% resist
  ],
};

