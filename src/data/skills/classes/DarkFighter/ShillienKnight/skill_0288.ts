import { SkillDefinition } from "../../../types";

// Guard Stance - increases P. Def and shield defense rate, continuously consumes MP
export const skill_0288: SkillDefinition = {
  id: 288,
  code: "SK_0288",
  name: "Guard Stance",
  description: "Increases P. Def. and the success rate of a shield defense. MP will be consumed continuously.\n\nУвеличивает физическую защиту и шанс защиты щитом. MP будет постоянно расходоваться.",
  icon: "/skills/skill0288.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 0,
  cooldown: 0,
  duration: 0, // Toggle skill
  mpPerTick: 5, // 5 MP per second
  effects: [
    { stat: "pDef", mode: "flat" }, // Value from level.power
    { stat: "shieldBlockRate", mode: "flat", value: 50 }, // 50% shield block rate
  ],
  levels: [
    { level: 1, requiredLevel: 43, spCost: 32000, mpCost: 8, power: 121.8 },
    { level: 2, requiredLevel: 52, spCost: 31000, mpCost: 10, power: 189.3 },
    { level: 3, requiredLevel: 64, spCost: 180000, mpCost: 12, power: 256.5 },
    { level: 4, requiredLevel: 70, spCost: 510000, mpCost: 13, power: 256.5 },
  ],
};

