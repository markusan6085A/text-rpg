import { SkillDefinition } from "../../../types";

// Fortitude - increases resistance to Shock/Paralysis attacks significantly, continuously consumes MP
export const skill_0335: SkillDefinition = {
  id: 335,
  code: "ST_0335",
  name: "Fortitude",
  description: "Increases resistance to Shock/Paralysis attacks significantly. Continuously consumes MP.\n\nЗначительно увеличивает сопротивление к шоку и параличу. Постоянно расходует MP.",
  icon: "/skills/skill0335.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 0,
  cooldown: 0,
  duration: 0, // Toggle skill
  mpPerTick: 5, // 5 MP per second (35 MP per 3 seconds in XML, but simplified to 5/sec)
  effects: [
    { stat: "shockResist", mode: "multiplier", multiplier: 0.7 }, // 30% resistance = 0.7 vulnerability
    { stat: "paralyzeResist", mode: "multiplier", multiplier: 0.7 }, // 30% resistance = 0.7 vulnerability
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 10000000, mpCost: 35, power: 0 },
  ],
};

