import { SkillDefinition } from "../../../types";

// Fortitude для PhoenixKnight (рівень 1)
export const skill_0335: SkillDefinition = {
  id: 335,
  code: "PKN_0335",
  name: "Fortitude",
  description: "Increases resistance to Shock/Paralysis attacks significantly. Continuously consumes MP.\n\nЗначительно увеличивает сопротивление к шоку и параличу на 30%. Непрерывно потребляет MP (35 MP каждые 3 сек).",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: 35, // З XML: mpConsume="35", time="3" для ManaDamOverTime
  tickInterval: 3, // З XML: time="3"
  stackType: "fortitude",
  stackOrder: 1,
  icon: "/skills/skill0335.gif",
  effects: [
    { stat: "shockResist", mode: "percent", value: 30 }, // Зменшує вразливість до Paralysis на 30%
    { stat: "stunResist", mode: "percent", value: 30 }, // Зменшує вразливість до Shock на 30%
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 10000000, mpCost: 35, power: 0 },
  ],
};

