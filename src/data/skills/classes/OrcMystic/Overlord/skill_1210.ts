import { SkillDefinition } from "../../../types";

// Seal of Gloom - toggle skill that gradually decreases the MP of nearby enemies
export const skill_1210: SkillDefinition = {
  id: 1210,
  code: "OL_1210",
  name: "Seal of Gloom",
  description: "Gradually decreases the MP of nearby enemies. Effect 5-6.\n\nПостепенно уменьшает MP ближайших врагов (35-40 MP каждые 5 секунд). Toggle-скіл: натисніть для ввімкнення/вимкнення. Без перезарядки.\n\nПостепенно уменьшает MP ближайших врагов (35-40 MP каждые 5 секунд). Переключаемый навык: нажмите для включения/выключения. Без перезарядки.",
  icon: "/skills/skill1210.gif",
  category: "toggle",
  powerType: "none",
  element: "dark",
  target: "self",
  scope: "area",
  toggle: true,
  stackType: "seal_gloom", // Unique stackType - different Seal debuffs stack, but same Seal levels replace
  // No cooldown for toggle skills - they can be toggled on/off instantly
  mpPerTick: -35, // Drains 35 MP per tick from nearby enemies
  tickInterval: 5, // Every 5 seconds
  chance: 40, // Chance to affect enemies
  levels: [
    { level: 1, requiredLevel: 44, spCost: 28000, mpCost: 59, power: 35 },
    { level: 2, requiredLevel: 52, spCost: 65000, mpCost: 70, power: 40 },
  ],
};

