import { SkillDefinition } from "../../../types";

// Soul Guard - toggle skill that increases P. Def. MP gets consumed continuously
export const skill_1283: SkillDefinition = {
  id: 1283,
  code: "OL_1283",
  name: "Soul Guard",
  description: "Increases P. Def. MP gets consumed continuously.\n\nУвеличивает физическую защиту. MP потребляется непрерывно (25 MP каждые 5 секунд на уровне 1, 30 MP каждые 5 секунд на уровнях 2-3).",
  icon: "/skills/skill1283.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: -25, // Consumes 25 MP per tick (level 1)
  tickInterval: 5, // Every 5 seconds
  effects: [
    { stat: "pDef", mode: "flat", value: 293.3 },
  ],
  levels: [
    { level: 1, requiredLevel: 44, spCost: 28000, mpCost: 8, power: 293.3 },
    { level: 2, requiredLevel: 48, spCost: 40000, mpCost: 9, power: 333.2 },
    { level: 3, requiredLevel: 52, spCost: 65000, mpCost: 10, power: 375.9 },
  ],
};

