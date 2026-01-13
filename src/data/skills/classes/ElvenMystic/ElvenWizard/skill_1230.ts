import { SkillDefinition } from "../../../types";

// Bright Servitor - temporarily increases servitor's M. Atk.
export const skill_1230: SkillDefinition = {
  id: 1230,
  code: "EW_1230",
  name: "Bright Servitor",
  description: "Temporarily increases servitor's M. Atk. Effect 1.\n\nВременно увеличивает магическую атаку сервитора на 55% на 20 сек. Кастуется на сервитора, действует в пределах дальности 400. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1230.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 20,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "mAtk", mode: "percent", value: 55 },
  ],
  levels: [
    { level: 1, requiredLevel: 35, spCost: 21000, mpCost: 30, power: 0 },
  ],
};

