import { SkillDefinition } from "../../../types";

// Fortitude - increases resistance to Shock/Paralysis attacks significantly, continuously consumes MP
export const skill_0335: SkillDefinition = {
  id: 335,
  code: "ET_0335",
  name: "Fortitude",
  description: "Increases resistance to Shock/Paralysis attacks significantly. Continuously consumes MP.\n\nУвеличивает сопротивление к шоку на 30%.\nУвеличивает сопротивление к параличу на 30%.\nПотребляет 0.5 MP каждые 5 секунд (около 5 MP/сек). Переключаемый навык.",
  icon: "/skills/skill0335.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: -5, // Consumes 5 MP per second (0.5 MP every 5 seconds ≈ 5 MP/sec)
  tickInterval: 1,
  stackType: "fortitude",
  stackOrder: 1,
  effects: [
    { stat: "shockResist", mode: "percent", value: 30 },
    { stat: "paralyzeResist", mode: "percent", value: 30 },
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 10000000, mpCost: 35, power: 0 },
  ],
};

