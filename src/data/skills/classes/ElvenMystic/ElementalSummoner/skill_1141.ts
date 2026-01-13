import { SkillDefinition } from "../../../types";

// Servitor Haste - Temporarily increases servitor's Atk. Spd.
export const skill_1141: SkillDefinition = {
  id: 1141,
  code: "ES_1141",
  name: "Servitor Haste",
  description: "Temporarily increases servitor's Atk. Spd. Effect 1.\n\nПризыв Servitor Haste на 20 мин., применяется на сервитора, действует в пределах дальности 400:\n- Увеличивает скорость атаки на 15%.",
  icon: "/skills/skill1141.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  effects: [
    { stat: "attackSpeed", mode: "percent", value: 15 },
  ],
  levels: [
    { level: 1, requiredLevel: 44, spCost: 44000, mpCost: 39, power: 15 },
    { level: 2, requiredLevel: 52, spCost: 100000, mpCost: 48, power: 33 },
  ],
};

