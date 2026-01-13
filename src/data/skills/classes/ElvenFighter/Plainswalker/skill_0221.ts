import { SkillDefinition } from "../../../types";

// Silent Move - disables preemptive attacks from enemies
export const skill_0221: SkillDefinition = {
  id: 221,
  code: "PW_0221",
  name: "Silent Move",
  description: "Disables preemptive attacks from enemies. Continuously consumes MP.\n\nОтключает упреждающие атаки от врагов. Непрерывно расходует MP (25 MP каждые 5 сек, около 5 MP/сек). Уменьшает агрессию врага на 100%. Уменьшает скорость передвижения на 40%.",
  icon: "/skills/skill0221.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: -5, // Consumes 5 MP per second
  tickInterval: 1,
  effects: [
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.6 }, // Reduces speed by 40%
  ],
  // Silent Move reduces enemy aggression - handled by game logic, not by stat modifiers
  levels: [
    { level: 1, requiredLevel: 40, spCost: 28000, mpCost: 7, power: 0 },
  ],
};

