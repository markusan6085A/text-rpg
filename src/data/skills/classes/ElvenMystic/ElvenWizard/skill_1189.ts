import { SkillDefinition } from "../../../types";

// Resist Aqua - temporarily increases tolerance to attack by water
export const skill_1189: SkillDefinition = {
  id: 1189,
  code: "EW_1189",
  name: "Resist Aqua",
  description: "Temporarily increases tolerance to attack by water. Effect 1.\n\nВременно увеличивает сопротивление к атакам водой на 15% на 20 сек. Кастуется на себя и союзников, действует в пределах дальности 400. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1189.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 20,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "waterResist", mode: "percent", value: 15 },
  ],
  levels: [
    { level: 1, requiredLevel: 25, spCost: 6100, mpCost: 23, power: 0 },
  ],
};

