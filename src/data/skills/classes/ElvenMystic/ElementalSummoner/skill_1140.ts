import { SkillDefinition } from "../../../types";

// Servitor Physical Shield - Temporarily increases servitor's P. Def.
export const skill_1140: SkillDefinition = {
  id: 1140,
  code: "ES_1140",
  name: "Servitor Physical Shield",
  description: "Temporarily increases servitor's P. Def. Effect 1.\n\nПризыв Servitor Physical Shield на 20 мин., применяется на сервитора, действует в пределах дальности 400:\n- Увеличивает физическую защиту на 8%.",
  icon: "/skills/skill1140.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "pDef", mode: "percent", value: 8 },
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 32000, mpCost: 35, power: 8 },
    { level: 2, requiredLevel: 48, spCost: 67000, mpCost: 44, power: 12 },
    { level: 3, requiredLevel: 56, spCost: 110000, mpCost: 52, power: 15 },
  ],
};

