import { SkillDefinition } from "../../../types";

// Final Servitor - The spirit of an ancient hero takes possession of the servitor
export const skill_1349: SkillDefinition = {
  id: 1349,
  code: "EM_1349",
  name: "Final Servitor",
  description: "The spirit of an ancient hero takes possession of the servitor for a certain period of time. Consumes 20 spirit ores.\n\nДух древнего героя временно вселяется в сервитора на 5 минут. Потребляет 20 Spirit Ore.\nУвеличивает максимальный HP на 20%.\nУвеличивает восстановление HP на 20%.\nУвеличивает точность для атаки на 4.\nУвеличивает физическую защиту на 20%.\nУвеличивает физическую атаку на 10%.\nУвеличивает урон критической атаки на 20%.\nУвеличивает скорость атаки на 20%.\nУвеличивает базовый шанс критической атаки на 20%.\nУменьшает скорость бега на 20%.\nУвеличивает магическую защиту на 20%.\nУвеличивает магическую атаку на 20%.\nУвеличивает скорость магии на 20%.\nУвеличивает сопротивление к дебаффам на 20%.",
  icon: "/skills/skill1349.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 300, // 5 minutes
  castTime: 4,
  cooldown: 600, // 10 minutes
  effects: [
    { stat: "maxHp", mode: "percent", value: 20 }, // maxHp 1.2
    { stat: "hpRegen", mode: "percent", value: 20 }, // regHp 1.2 (restores 20% of max HP)
    { stat: "accuracy", mode: "flat", value: 4 }, // accCombat +4
    { stat: "pDef", mode: "percent", value: 20 }, // pDef 1.2
    { stat: "pAtk", mode: "percent", value: 10 }, // pAtk 1.1
    { stat: "critDamage", mode: "percent", value: 20 }, // cAtk 1.2 (20% increase)
    { stat: "attackSpeed", mode: "percent", value: 20 }, // pAtkSpd 1.2
    { stat: "critRate", mode: "multiplier", multiplier: 1.2 }, // basemul rCrit 0.2 + mul rCrit 1.2 (base 20% + 20% = 1.2x)
    { stat: "mDef", mode: "percent", value: 20 }, // mDef 1.2
    { stat: "mAtk", mode: "percent", value: 20 }, // mAtk 1.2
    { stat: "castSpeed", mode: "percent", value: 20 }, // mAtkSpd 1.2
    { stat: "debuffResist", mode: "percent", value: 20 }, // debuffVuln 0.8 (20% resist)
    { stat: "runSpeed", mode: "percent", value: -20 }, // runSpd 0.8
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 72, power: 0 },
  ],
};

