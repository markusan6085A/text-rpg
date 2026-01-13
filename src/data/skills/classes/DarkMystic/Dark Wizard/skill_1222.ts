import { SkillDefinition } from "../../../types";

// Curse Chaos
export const skill_1222: SkillDefinition = {
  id: 1222,
  code: "DW_1222",
  name: "Curse Chaos",
  description: "Decreases target's Accuracy. Effect 2.\n\nСнижает точность цели на 12-13 на 15 сек. с базовым шансом 80% (прохождение зависит от WIT цели), кастуется на врагов, действует в пределах дальности 600: - Снижает Accuracy на 12-13.",
  icon: "/skills/skill1222.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 8,
  duration: 15,
  chance: 80,
  effects: [{ stat: "accuracy", mode: "flat" }], // Value from level.power (negative)
  levels: [
    { level: 1, requiredLevel: 35, spCost: 13000, mpCost: 15, power: -12 },
    { level: 2, requiredLevel: 40, spCost: 29000, mpCost: 39, power: -13 },
    { level: 3, requiredLevel: 44, spCost: 48000, mpCost: 44, power: -13 },
    { level: 4, requiredLevel: 48, spCost: 71000, mpCost: 48, power: -13 },
    { level: 5, requiredLevel: 52, spCost: 92000, mpCost: 52, power: -13 },
    { level: 6, requiredLevel: 56, spCost: 130000, mpCost: 55, power: -13 },
    { level: 7, requiredLevel: 58, spCost: 180000, mpCost: 56, power: -13 },
    { level: 8, requiredLevel: 60, spCost: 230000, mpCost: 57, power: -13 },
    { level: 9, requiredLevel: 62, spCost: 280000, mpCost: 58, power: -13 },
    { level: 10, requiredLevel: 64, spCost: 320000, mpCost: 59, power: -13 },
    { level: 11, requiredLevel: 66, spCost: 360000, mpCost: 60, power: -13 },
    { level: 12, requiredLevel: 68, spCost: 400000, mpCost: 61, power: -13 },
    { level: 13, requiredLevel: 70, spCost: 440000, mpCost: 62, power: -13 },
    { level: 14, requiredLevel: 72, spCost: 480000, mpCost: 63, power: -13 },
    { level: 15, requiredLevel: 74, spCost: 520000, mpCost: 64, power: -13 },
  ],
};

