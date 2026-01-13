import { SkillDefinition } from "../../../types";

// Wizard Servitor - The spirit of an ancient wizard takes possession of the servitor
export const skill_1347: SkillDefinition = {
  id: 1347,
  code: "EM_1347",
  name: "Wizard Servitor",
  description: "The spirit of an ancient wizard takes possession of the servitor for a certain period of time. Consumes 10 spirit ores.\n\nДух древнего мага временно вселяется в сервитора на 5 минут. Потребляет 10 Spirit Ore.\nУвеличивает восстановление MP на 20%.\nУвеличивает магическую защиту на 20%.\nУвеличивает шанс критической атаки магией на 100%.\nУвеличивает магическую атаку на 20%.\nУвеличивает скорость магии на 20%.\nУменьшает скорость бега на 20%.\nУвеличивает сопротивление к дебаффам на 10%.",
  icon: "/skills/skill1347.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 300, // 5 minutes
  castTime: 4,
  cooldown: 300, // 5 minutes
  effects: [
    { stat: "mpRegen", mode: "percent", value: 20 }, // regMp 1.2
    { stat: "mDef", mode: "percent", value: 20 }, // mDef 1.2
    { stat: "skillCritRate", mode: "percent", value: 100 }, // mCritRate 2 (100% increase)
    { stat: "mAtk", mode: "percent", value: 20 }, // mAtk 1.2
    { stat: "castSpeed", mode: "percent", value: 20 }, // mAtkSpd 1.2
    { stat: "runSpeed", mode: "percent", value: -20 }, // runSpd 0.8
    { stat: "debuffResist", mode: "percent", value: 10 }, // debuffVuln 0.9 (10% resist)
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 70, power: 0 },
  ],
};

