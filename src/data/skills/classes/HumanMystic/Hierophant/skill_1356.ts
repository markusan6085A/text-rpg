import { SkillDefinition } from "../../../types";

export const skill_1356: SkillDefinition = {
  id: 1356,
  code: "HM_1356",
  name: "Prophecy of Fire",
  description: "The spirit of an ancient warrior temporarily possesses the user. Consumes 5 spirit ores.\n\nДух древнего воина временно вселяется в пользователя. Потребляет 5 Spirit Ore.",
  category: "buff",
  powerType: "percent",
  icon: "/skills/skill1356.gif",
  target: "party",
  duration: 1200,
  castTime: 4,
  cooldown: 120,
  effects: [
    { stat: "maxHp", mode: "percent", value: 20 },
    { stat: "hpRegen", mode: "percent", value: 20 },
    { stat: "pDef", mode: "percent", value: 20 },
    { stat: "atkSpeed", mode: "percent", value: 20 },
    { stat: "accuracy", mode: "flat", value: 4 },
    { stat: "pAtk", mode: "percent", value: 10 },
    { stat: "runSpeed", mode: "percent", value: -10 },
    { stat: "debuffResist", mode: "percent", value: 10 },
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 72, power: 1.1 },
  ],
};

