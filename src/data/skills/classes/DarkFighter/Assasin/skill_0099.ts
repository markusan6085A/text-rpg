import { SkillDefinition } from "../../../types";

// Rapid Shot - increases speed of arrow launch
export const skill_0099: SkillDefinition = {
  id: 99,
  code: "AS_0099",
  name: "Rapid Shot",
  description: "Increases speed of arrow launch. Effect 1.\n\nУвеличивает скорость запуска стрел на 8%.",
  icon: "/skills/skill0099.gif",
  category: "buff",
  powerType: "multiplier",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 10,
  duration: 20,
  effects: [
    {
      "stat": "atkSpeed",
      "mode": "multiplier"
    }
  ],
  levels: [
    { level: 1, requiredLevel: 32, spCost: 14000, mpCost: 28, power: 1.08 }, // Increases attack speed by 8% (1.08 = 8%)
  ],
};

