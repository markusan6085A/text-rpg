import { SkillDefinition } from "../../../types";

// Servitor Ultimate Defense - Significantly increases a servitor's P. Def. and M. Def. for a brief time period. Servitor is immobilized while in effect.
export const skill_1299: SkillDefinition = {
  id: 1299,
  code: "ES_1299",
  name: "Servitor Ultimate Defense",
  description: "Significantly increases a servitor's P. Def. and M. Def. for a brief time period. Servitor is immobilized while in effect. Effect 1.\n\nПризыв Servitor Ultimate Defense на 30 сек., применяется на сервитора, действует в пределах дальности 400:\n- Увеличивает физическую защиту на 1800.\n- Увеличивает магическую защиту на 1350.\n- Обездвиживает.",
  icon: "/skills/skill1299.gif",
  category: "buff",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 1,
  cooldown: 1800, // 30 minutes
  duration: 30,
  effects: [
    { stat: "pDef", mode: "flat", value: 1800 },
    { stat: "mDef", mode: "flat", value: 1350 },
    { stat: "immobile", mode: "flat", value: 1 },
  ],
  levels: [
    { level: 1, requiredLevel: 52, spCost: 100000, mpCost: 48, power: 0 },
    { level: 2, requiredLevel: 70, spCost: 670000, mpCost: 65, power: 0 },
  ],
};

