import { SkillDefinition } from "../../../types";

// Prophecy of Water - The spirit of an ancient wizard temporarily possesses the user
// З файлу: багато ефектів, тривалість 5 хв, споживає 5 Spirit Ore
export const skill_1357: SkillDefinition = {
  id: 1357,
  code: "ES_1357",
  name: "Prophecy of Water",
  description: "The spirit of an ancient wizard temporarily possesses the user. Consumes 5 spirit ores.\n\nДух древнего мага временно вселяется в пользователя. Потребляет 5 Spirit Ore. Длительность: 5 мин. Каст: 4 сек. Перезарядка: 120 сек.\n\nЭффекты:\n- Увеличивает регенерацию MP на 20%.\n- Увеличивает скорость регенерации MP на 20%.\n- Увеличивает максимальный MP на 20%.\n- Увеличивает максимальный HP на 20%.\n- Увеличивает магическую защиту на 20%.\n- Увеличивает сопротивление к дебаффам на 10%.",
  category: "buff",
  powerType: "percent",
  icon: "/skills/skill1357.gif",
  target: "party",
  scope: "party",
  duration: 300, // 5 minutes
  castTime: 4,
  cooldown: 120,
  effects: [
    { stat: "mpRegen", mode: "percent", value: 20 },
    { stat: "regMp", mode: "percent", value: 20 },
    { stat: "maxMp", mode: "percent", value: 20 },
    { stat: "maxHp", mode: "percent", value: 20 },
    { stat: "mDef", mode: "percent", value: 20 },
    { stat: "debuffResist", mode: "percent", value: 10 },
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 72, power: 0 },
  ],
};

