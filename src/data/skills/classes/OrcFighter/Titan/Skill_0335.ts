import { SkillDefinition } from "../../../types";

export const Skill_0335: SkillDefinition = {
  id: 335,
  code: "OR_0335",
  name: "Fortitude",
  description: "Increases resistance to Shock/Paralysis attacks significantly. Continuously consumes MP.\n\nЗначительно увеличивает сопротивление к шоку/параличу. Постоянно потребляет MP.",
  icon: "/skills/skill0335.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: 0.5,
  effects: [
    { stat: "stunResist", mode: "multiplier", multiplier: 0.7 },
    { stat: "paralyzeResist", mode: "multiplier", multiplier: 0.7 },
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 10000000, mpCost: 35, power: 0 },
  ],
};

