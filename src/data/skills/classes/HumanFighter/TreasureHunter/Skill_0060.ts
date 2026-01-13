import { SkillDefinition } from "../../../types";

export const Skill_0060: SkillDefinition = {
  id: 60,
  code: "HF_0060",
  name: "Fake Death",
  description: "Makes PC play dead and dissuades the enemy from attacking. Continuously consumes MP.\n\nЗаставляет персонажа притвориться мертвым и отговаривает врага от атаки. Постоянно потребляет MP.",
  icon: "/skills/skill0060.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: 200,
  tickInterval: 1,
  levels: [
    { level: 1, requiredLevel: 40, spCost: 35000, mpCost: 200, power: 0 },
  ],
};

