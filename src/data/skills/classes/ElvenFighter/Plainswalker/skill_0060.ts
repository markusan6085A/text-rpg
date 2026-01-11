import { SkillDefinition } from "../../../types";

// Fake Death - makes PC play dead and dissuades enemy from attacking
export const skill_0060: SkillDefinition = {
  id: 60,
  code: "PW_0060",
  name: "Fake Death",
  description: "Makes PC play dead and dissuades the enemy from attacking. Continuously consumes MP.\n\nЗаставляет персонажа притвориться мертвым и отговаривает врага от атаки. Непрерывно расходует MP (200 MP/сек). Уменьшает агрессию врага на 70%.",
  icon: "/skills/skill0060.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: -200, // Consumes 200 MP per second
  tickInterval: 1,
  // Fake Death reduces enemy aggression - handled by game logic, not by stat modifiers
  effects: [],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 28000, mpCost: 200, power: 0 },
  ],
};

