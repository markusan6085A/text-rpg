import { SkillDefinition } from "../../../types";

export const Skill_0099: SkillDefinition = {
  id: 99,
  code: "HF_0099",
  name: "Rapid Shot",
  description: "Increases speed of arrow launch.\n\nУвеличивает скорость запуска стрел на 8%.",
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
    {
      "level": 1,
      "requiredLevel": 32,
      "spCost": 18000,
      "mpCost": 14,
      "power": 1.08 // 8% increase = 1.08 multiplier
    }
  ]
};
