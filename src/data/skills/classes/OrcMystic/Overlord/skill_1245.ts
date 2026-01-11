import { SkillDefinition } from "../../../types";

// Steal Essence - magic attack skill that absorbs target's HP
export const skill_1245: SkillDefinition = {
  id: 1245,
  code: "OL_1245",
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
    { level: 1, requiredLevel: 40, spCost: 22000, mpCost: 70, power: 52 },
    { level: 2, requiredLevel: 44, spCost: 28000, mpCost: 78, power: 58 },
    { level: 3, requiredLevel: 48, spCost: 40000, mpCost: 87, power: 65 },
    { level: 4, requiredLevel: 52, spCost: 65000, mpCost: 94, power: 72 },
  ],
};

