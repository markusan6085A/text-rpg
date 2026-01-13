import { SkillDefinition } from "../../../types";

// Weapon Mastery - продолжение уровней для Elemental Summoner (lv.10-42)
export const skill_0142: SkillDefinition = {
  id: 142,
  code: "EW_0142",
  name: "Weapon Mastery",
  description: "Increases P. Atk. and M. Atk.\n\nУвеличивает физическую атаку на 16-79.4 (зависит от уровня).\nУвеличивает магическую атаку на 20-99.3 (зависит от уровня).\nУвеличивает физическую атаку на 45%.\nУвеличивает магическую атаку на 17%.",
  icon: "/skills/skill0142.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "flat" },
    { stat: "mAtk", mode: "flat" },
    { stat: "pAtk", mode: "percent", value: 45 },
    { stat: "mAtk", mode: "percent", value: 17 },
  ],
  levels: [
    // Level 40
    { level: 10, requiredLevel: 40, spCost: 10000, mpCost: 0, power: 16 },
    { level: 11, requiredLevel: 40, spCost: 10000, mpCost: 0, power: 17 },
    { level: 12, requiredLevel: 40, spCost: 10000, mpCost: 0, power: 18.1 },
    // Level 44
    { level: 13, requiredLevel: 44, spCost: 15000, mpCost: 0, power: 20.4 },
    { level: 14, requiredLevel: 44, spCost: 15000, mpCost: 0, power: 21.6 },
    { level: 15, requiredLevel: 44, spCost: 15000, mpCost: 0, power: 22.8 },
    // Level 48
    { level: 16, requiredLevel: 48, spCost: 22000, mpCost: 0, power: 25.5 },
    { level: 17, requiredLevel: 48, spCost: 22000, mpCost: 0, power: 26.9 },
    { level: 18, requiredLevel: 48, spCost: 22000, mpCost: 0, power: 28.3 },
    // Level 52
    { level: 19, requiredLevel: 52, spCost: 35000, mpCost: 0, power: 31.4 },
    { level: 20, requiredLevel: 52, spCost: 35000, mpCost: 0, power: 33 },
    { level: 21, requiredLevel: 52, spCost: 35000, mpCost: 0, power: 34.6 },
    // Level 56
    { level: 22, requiredLevel: 56, spCost: 37000, mpCost: 0, power: 38 },
    { level: 23, requiredLevel: 56, spCost: 37000, mpCost: 0, power: 39.8 },
    { level: 24, requiredLevel: 56, spCost: 37000, mpCost: 0, power: 41.7 },
    // Level 58
    { level: 25, requiredLevel: 58, spCost: 92000, mpCost: 0, power: 43.5 },
    { level: 26, requiredLevel: 58, spCost: 92000, mpCost: 0, power: 45.4 },
    // Level 60
    { level: 27, requiredLevel: 60, spCost: 110000, mpCost: 0, power: 47.4 },
    { level: 28, requiredLevel: 60, spCost: 110000, mpCost: 0, power: 49.4 },
    // Level 62
    { level: 29, requiredLevel: 62, spCost: 150000, mpCost: 0, power: 51.4 },
    { level: 30, requiredLevel: 62, spCost: 150000, mpCost: 0, power: 53.5 },
    // Level 64
    { level: 31, requiredLevel: 64, spCost: 200000, mpCost: 0, power: 55.6 },
    { level: 32, requiredLevel: 64, spCost: 200000, mpCost: 0, power: 57.7 },
    // Level 66
    { level: 33, requiredLevel: 66, spCost: 270000, mpCost: 0, power: 59.8 },
    { level: 34, requiredLevel: 66, spCost: 270000, mpCost: 0, power: 62 },
    // Level 68
    { level: 35, requiredLevel: 68, spCost: 320000, mpCost: 0, power: 64.1 },
    { level: 36, requiredLevel: 68, spCost: 320000, mpCost: 0, power: 66.3 },
    // Level 70
    { level: 37, requiredLevel: 70, spCost: 340000, mpCost: 0, power: 68.5 },
    { level: 38, requiredLevel: 70, spCost: 340000, mpCost: 0, power: 70.7 },
    // Level 72
    { level: 39, requiredLevel: 72, spCost: 630000, mpCost: 0, power: 72.9 },
    { level: 40, requiredLevel: 72, spCost: 630000, mpCost: 0, power: 75.1 },
    // Level 74
    { level: 41, requiredLevel: 74, spCost: 820000, mpCost: 0, power: 77.2 },
    { level: 42, requiredLevel: 74, spCost: 820000, mpCost: 0, power: 79.4 },
  ],
};

