import { SkillDefinition } from "../../../types";

// Divine Protection - Temporarily increases resistance to dark attack
// З файлу: опір до темної атаки +30%, тривалість 20 хв
export const skill_1353: SkillDefinition = {
  id: 1353,
  code: "ES_1353",
  name: "Divine Protection",
  description: "Temporarily increases resistance to dark attack. Effect 3.\n\nВременно увеличивает сопротивление к темным атакам на 30%. Длительность: 20 мин. Каст: 4 сек. Перезарядка: 10 сек.",
  icon: "/skills/skill1353.gif",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 10,
  duration: 1200, // 20 minutes
  effects: [{ stat: "darkResist", mode: "percent", value: 30 }],
  stackType: "divine_protection",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 77,
      spCost: 13000000,
      mpCost: 70,
      power: 30,
    },
  ],
};

