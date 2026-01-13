import { SkillDefinition } from "../../../types";

// Shield Fortress - increases personal shield defense rate, continuously consumes MP
export const skill_0322: SkillDefinition = {
  id: 322,
  code: "SK_0322",
  name: "Shield Fortress",
  description: "Increases personal shield defense rate. Continuously consumes MP.\n\nУвеличивает личную защиту щитом. Постоянно расходует MP.",
  icon: "/skills/skill0322.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 0,
  cooldown: 0,
  duration: 0, // Toggle skill
  mpPerTick: 5, // 5 MP per second
  effects: [
    { stat: "shieldBlockRate", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 2, requiredLevel: 66, spCost: 240000, mpCost: 11, power: 469 },
    { level: 3, requiredLevel: 68, spCost: 300000, mpCost: 12, power: 491.5 },
    { level: 4, requiredLevel: 70, spCost: 510000, mpCost: 13, power: 514 },
    { level: 5, requiredLevel: 72, spCost: 880000, mpCost: 14, power: 537 },
    { level: 6, requiredLevel: 74, spCost: 1400000, mpCost: 14, power: 560 },
  ],
};

