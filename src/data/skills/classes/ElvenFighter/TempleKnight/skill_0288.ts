import { SkillDefinition } from "../../../types";

// Guard Stance - increases P. Def and shield defense rate, continuously consumes MP
export const skill_0288: SkillDefinition = {
  id: 288,
  code: "TK_0288",
  name: "Guard Stance",
  description: "Increases P. Def. and the success rate of a shield defense. MP will be consumed continuously.\n\nУвеличивает физическую защиту на 121.8-256.5 (зависит от уровня) и шанс защиты щитом на 50%. Потребляет 1 MP каждые 5 секунд (около 5 MP/сек). Переключаемый навык.",
  icon: "/skills/skill0288.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: -5, // Consumes 5 MP per second
  tickInterval: 1,
  effects: [
    { stat: "pDef", mode: "flat" }, // Value from level.power
    { stat: "shieldBlockRate", mode: "flat", value: 50 }, // 50% shield block rate
  ],
  levels: [
    { level: 1, requiredLevel: 43, spCost: 35000, mpCost: 8, power: 121.8 },
    { level: 2, requiredLevel: 52, spCost: 120000, mpCost: 10, power: 161.1 },
    { level: 3, requiredLevel: 62, spCost: 310000, mpCost: 12, power: 212.1 },
    { level: 4, requiredLevel: 70, spCost: 720000, mpCost: 13, power: 256.5 },
  ],
};

