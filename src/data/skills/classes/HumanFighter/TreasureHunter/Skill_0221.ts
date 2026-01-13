import { SkillDefinition } from "../../../types";

export const Skill_0221: SkillDefinition = {
  id: 221,
  code: "HF_0221",
  name: "Silent Move",
  description: "Disables preemptive attacks from enemies. Continuously consumes MP.\n\nОтключает упреждающие атаки от врагов. Постоянно потребляет MP.",
  icon: "/skills/skill0221.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: 25, // 5 MP/sec * 5 seconds = 25 MP per tick
  tickInterval: 5,
  levels: [
    { level: 1, requiredLevel: 40, spCost: 35000, mpCost: 7, power: 0 },
  ],
};

