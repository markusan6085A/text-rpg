import { SkillDefinition } from "../../../types";

// Rapid Shot lv.2 - increases speed of arrow launch
export const skill_0099_lv2: SkillDefinition = {
  id: 99,
  code: "SR_0099",
  name: "Rapid Shot",
  description: "Increases speed of arrow launch. Effect 2.\n\nУвеличивает скорость запуска стрел на 12% на 20 сек.",
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
      "mode": "multiplier",
      "multiplier": 1.12
    }
  ],
  levels: [
    { level: 2, requiredLevel: 55, spCost: 200000, mpCost: 50, power: 1.12 }, // Increases attack speed by 12% (1.12 = 12%)
  ],
};

