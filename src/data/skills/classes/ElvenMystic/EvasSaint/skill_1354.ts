import { SkillDefinition } from "../../../types";

// Arcane Protection - Temporarily increases resistance to buff cancel and de-buff attack
// З файлу: cancel resist +30%, debuff resist +20%, тривалість 20 хв
export const skill_1354: SkillDefinition = {
  id: 1354,
  code: "ES_1354",
  name: "Arcane Protection",
  description: "Temporarily increases resistance to buff cancel and de-buff attack. Effect 3.\n\nВременно увеличивает сопротивление к отмене баффов на 30% и к дебаффам на 20%. Длительность: 20 мин. Каст: 4 сек. Перезарядка: 10 сек.",
  icon: "/skills/skill1354.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 10,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "cancelResist", mode: "percent", value: 30 },
    { stat: "debuffResist", mode: "percent", value: 20 },
  ],
  stackType: "arcane_protection",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 76,
      spCost: 10000000,
      mpCost: 70,
      power: 0,
    },
  ],
};

