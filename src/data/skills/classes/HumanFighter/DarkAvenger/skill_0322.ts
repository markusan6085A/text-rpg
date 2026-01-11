import { SkillDefinition } from "../../../types";

// Shield Fortress для DarkAvenger (рівні 1-6)
export const skill_0322: SkillDefinition = {
  id: 322,
  code: "DAV_0322",
  name: "Shield Fortress",
  description: "Increases personal shield defense rate. Continuously consumes MP.\n\nУвеличивает личную защиту щитом на 446-560 (зависит от уровня). Непрерывно потребляет MP (25.6-29.6 MP каждые 5 сек). Требуется щит. Переключаемый навык.",
  category: "toggle",
  powerType: "flat",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: 27.6, // З XML: val="#val" (25.6, 26.4, 27.2, 28, 28.8, 29.6) - середнє значення
  tickInterval: 5, // З XML: time="5" для ManaDamOverTime
  stackType: "shield_fortress",
  stackOrder: 1,
  icon: "/skills/skill0322.gif",
  effects: [
    { stat: "shieldBlockRate", mode: "flat" }, // value буде взято з levelDef.power
  ],
  levels: [
    { level: 1, requiredLevel: 64, spCost: 370000, mpCost: 12, power: 446 },
    { level: 2, requiredLevel: 66, spCost: 580000, mpCost: 13, power: 468 },
    { level: 3, requiredLevel: 68, spCost: 650000, mpCost: 13, power: 491 },
    { level: 4, requiredLevel: 70, spCost: 780000, mpCost: 13, power: 514 },
    { level: 5, requiredLevel: 72, spCost: 1200000, mpCost: 14, power: 537 },
    { level: 6, requiredLevel: 74, spCost: 1900000, mpCost: 14, power: 560 },
  ],
};

