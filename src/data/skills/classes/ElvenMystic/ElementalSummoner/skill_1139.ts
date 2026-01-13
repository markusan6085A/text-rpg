import { SkillDefinition } from "../../../types";

// Servitor Magic Shield - Temporarily increases servitor's M. Def.
export const skill_1139: SkillDefinition = {
  id: 1139,
  code: "ES_1139",
  name: "Servitor Magic Shield",
  description: "Temporarily increases servitor's M. Def. Effect 2.\n\nПризыв Servitor Magic Shield на 20 мин., применяется на сервитора, действует в пределах дальности 400:\n- Увеличивает магическую защиту на 23%.",
  icon: "/skills/skill1139.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "mDef", mode: "percent", value: 23 },
  ],
  levels: [
    { level: 1, requiredLevel: 44, spCost: 44000, mpCost: 39, power: 23 },
    { level: 2, requiredLevel: 52, spCost: 100000, mpCost: 48, power: 30 },
  ],
};

