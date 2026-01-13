import { SkillDefinition } from "../../../types";

// Steal Essence - magic attack skill that absorbs target's HP (Levels 1-4 for Warcryer)
// Data from Warcryer.txt
export const skill_1245: SkillDefinition = {
  id: 1245,
  code: "WC_1245",
  name: "Steal Essence",
  description: "Absorbs target's HP. Power 52-72.\n\nПоглощает HP цели. Мощность 52-72. 80% урона восстанавливается как HP.",
  icon: "/skills/skill1245.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "dark",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  chance: 80,
  effects: [
    { stat: "vampirism", mode: "percent", value: 80 },
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 27000, mpCost: 70, power: 52 },
    { level: 2, requiredLevel: 44, spCost: 37000, mpCost: 78, power: 58 },
    { level: 3, requiredLevel: 48, spCost: 63000, mpCost: 87, power: 65 },
    { level: 4, requiredLevel: 52, spCost: 95000, mpCost: 94, power: 72 },
    { level: 5, requiredLevel: 56, spCost: 110000, mpCost: 103, power: 78 },
    { level: 6, requiredLevel: 58, spCost: 160000, mpCost: 107, power: 82 },
    { level: 7, requiredLevel: 60, spCost: 200000, mpCost: 110, power: 85 },
    { level: 8, requiredLevel: 62, spCost: 310000, mpCost: 115, power: 89 },
    { level: 9, requiredLevel: 64, spCost: 320000, mpCost: 119, power: 92 },
    { level: 10, requiredLevel: 66, spCost: 500000, mpCost: 123, power: 96 },
    { level: 11, requiredLevel: 68, spCost: 550000, mpCost: 127, power: 99 },
    { level: 12, requiredLevel: 70, spCost: 720000, mpCost: 130, power: 102 },
    { level: 13, requiredLevel: 72, spCost: 1100000, mpCost: 133, power: 105 },
    { level: 14, requiredLevel: 74, spCost: 1500000, mpCost: 137, power: 108 },
  ],
};

