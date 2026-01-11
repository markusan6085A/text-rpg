import { SkillDefinition } from "../../../types";

// Block Wind Walk - Removes buffs that increase Speed from a targeted enemy
// З файлу: зменшує швидкість на 10%, тривалість 2 хв, шанс 80%
export const skill_1359: SkillDefinition = {
  id: 1359,
  code: "ES_1359",
  name: "Block Wind Walk",
  description: "Removes buffs that increase Speed from a targeted enemy. Temporarily decreases Speed and prevents enemy from receiving removed buffs that will increase Speed again.\n\nУдаляет бафы, увеличивающие скорость, с выбранного врага. Временно снижает скорость на 10% и предотвращает получение врагом удаленных бафов, увеличивающих скорость. Длительность: 2 мин. Каст: 4 сек. Перезарядка: 30 сек.",
  category: "debuff",
  powerType: "percent",
  icon: "/skills/skill1359.gif",
  target: "enemy",
  duration: 120, // 2 minutes
  castTime: 4,
  cooldown: 30,
  effects: [
    { stat: "runSpeed", mode: "percent", value: -10, chance: 80 },
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 13000000, mpCost: 70, power: 80 },
  ],
};

