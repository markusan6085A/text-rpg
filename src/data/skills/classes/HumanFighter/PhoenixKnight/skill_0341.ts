import { SkillDefinition } from "../../../types";

// Touch of Life для PhoenixKnight (рівень 1)
export const skill_0341: SkillDefinition = {
  id: 341,
  code: "PKN_0341",
  name: "Touch of Life",
  description: "Bestows a sacred blessing that increases attack speed and defenses.\n\nДарует святое благословение, которое увеличивает скорость атаки на 10%, физ. защиту на 5% и маг. защиту на 5% на 20 мин. Каст: 1.8 сек. Перезарядка: 5 мин.",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 1.8,
  cooldown: 300, // 5 хвилин
  duration: 1200, // 20 хвилин
  icon: "/skills/skill0341.gif",
  effects: [
    { stat: "atkSpeed", mode: "percent", value: 10, duration: 1200 }, // +10% швидкості атаки на 20 хв
    { stat: "pDef", mode: "percent", value: 5, duration: 1200 }, // +5% фіз. захисту на 20 хв
    { stat: "mDef", mode: "percent", value: 5, duration: 1200 }, // +5% маг. захисту на 20 хв
  ],
  stackType: "touch_of_life",
  stackOrder: 1,
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 0, power: 0 },
  ],
};

