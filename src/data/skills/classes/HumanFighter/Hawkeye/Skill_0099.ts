import { SkillDefinition } from "../../../types";

export const Skill_0099: SkillDefinition = {
  id: 99,
  code: "HF_0099",
  name: "Rapid Shot",
  description: "Increases speed of arrow launch.\n\nУвеличивает скорость запуска стрел.",
  icon: "/skills/skill0099.gif",
  category: "buff",
  powerType: "multiplier",
  target: "self",
  scope: "single",
  duration: 1200,
  effects: [
    {
      "stat": "atkSpeed",
      "mode": "multiplier"
    }
  ],
  castTime: 1.5,
  cooldown: 10,
  levels: [
    { level: 2, requiredLevel: 40, spCost: 0, mpCost: 20, power: 1.12 },
  ],
};

