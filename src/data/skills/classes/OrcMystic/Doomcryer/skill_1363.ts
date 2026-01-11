import { SkillDefinition } from "../../../types";

// Chant of Victory - buff skill that temporarily increases party members' stats significantly. Consumes 40 spirit ores.
export const skill_1363: SkillDefinition = {
  id: 1363,
  code: "DC_1363",
  name: "Chant of Victory",
  description: "The spirits of ancient heroes temporarily possess one's party members. Consumes 40 spirit ores. Effect 1.\n\nДухи древних героев временно вселяются в членов группы. Потребляет 40 Spirit Ore. Длительность: 20 мин.\n\nУвеличивает:\n- Максимальный HP на 20%\n- Восстановление HP на 20%\n- Физическую атаку на 10%\n- Физическую защиту на 20%\n- Точность на 4\n- Шанс критического удара на 20%\n- Скорость атаки на 20%\n- Скорость каста на 20%\n- Критический урон на 20%\n- Магическую атаку на 20%\n- Магическую защиту на 20%\n- Скорость передвижения на 20%\n- Сопротивление к дебафам на 20%",
  icon: "/skills/skill1363.gif",
  category: "buff",
  powerType: "none",
  target: "party",
  scope: "area",
  castTime: 2.5,
  cooldown: 1200, // 20 minutes
  duration: 1200, // 20 minutes
  stackType: "chant_victory", // Unique stackType - different levels replace each other
  effects: [
    { stat: "maxHp", mode: "multiplier", multiplier: 1.2 }, // 20% increase
    { stat: "hpRegen", mode: "percent", value: 20 },
    { stat: "pAtk", mode: "multiplier", multiplier: 1.1 }, // 10% increase
    { stat: "pDef", mode: "multiplier", multiplier: 1.2 }, // 20% increase
    { stat: "accuracy", mode: "flat", value: 4 },
    { stat: "critRate", mode: "percent", value: 20 },
    { stat: "atkSpeed", mode: "multiplier", multiplier: 1.2 }, // 20% increase
    { stat: "castSpeed", mode: "multiplier", multiplier: 1.2 }, // 20% increase
    { stat: "critDamage", mode: "multiplier", multiplier: 1.2 }, // 20% increase
    { stat: "mAtk", mode: "multiplier", multiplier: 1.2 }, // 20% increase
    { stat: "mDef", mode: "multiplier", multiplier: 1.2 }, // 20% increase
    { stat: "runSpeed", mode: "multiplier", multiplier: 1.2 }, // 20% increase
    { stat: "debuffResist", mode: "percent", value: 20 },
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 284, power: 20 }, // 78 lvl для Doomcryer
  ],
};

