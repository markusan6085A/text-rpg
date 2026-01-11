import { SkillDefinition } from "../../../types";

// Shield Fortress - increases personal shield defense rate, continuously consumes MP
export const skill_0322: SkillDefinition = {
  id: 322,
  code: "TK_0322",
  name: "Shield Fortress",
  description: "Increases personal shield defense rate. Continuously consumes MP.\n\nУвеличивает личную защиту щитом на 446-560 (зависит от уровня). Потребляет 0.4 MP каждые 5 секунд (около 5 MP/сек). Требуется щит. Переключаемый навык.",
  icon: "/skills/skill0322.gif",
  category: "toggle",
  powerType: "flat",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: -5, // Consumes 5 MP per second (0.4 MP every 5 seconds ≈ 5 MP/sec)
  tickInterval: 1,
  stackType: "shield_fortress",
  stackOrder: 1,
  effects: [
    { stat: "shieldBlockRate", mode: "flat" }, // value буде взято з levelDef.power
  ],
  levels: [
    { level: 1, requiredLevel: 64, spCost: 370000, mpCost: 12, power: 446 },
    { level: 2, requiredLevel: 66, spCost: 580000, mpCost: 13, power: 469 },
    { level: 3, requiredLevel: 68, spCost: 650000, mpCost: 13, power: 491 },
    { level: 4, requiredLevel: 70, spCost: 720000, mpCost: 13, power: 514 },
    { level: 5, requiredLevel: 72, spCost: 1200000, mpCost: 14, power: 537 },
    { level: 6, requiredLevel: 74, spCost: 1900000, mpCost: 14, power: 560 },
  ],
};

