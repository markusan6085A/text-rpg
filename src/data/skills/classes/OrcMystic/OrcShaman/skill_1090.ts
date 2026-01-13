import { SkillDefinition } from "../../../types";

// Life Drain - magic attack skill (Levels 3-6 for OrcShaman)
export const skill_1090: SkillDefinition = {
  id: 1090,
  code: "OS_1090",
  name: "Life Drain",
  description: "Absorbs target's HP. Power 26-44.\n\nПоглощает HP цели. 80% урона восстанавливается как HP.",
  icon: "/skills/skill1090.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "dark",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "vampirism", mode: "percent", value: 80 },
  ],
  levels: [
    { level: 3, requiredLevel: 20, spCost: 2900, mpCost: 39, power: 26 },
    { level: 4, requiredLevel: 25, spCost: 5800, mpCost: 44, power: 32 },
    { level: 5, requiredLevel: 30, spCost: 11000, mpCost: 53, power: 38 },
    { level: 6, requiredLevel: 35, spCost: 18000, mpCost: 60, power: 44 },
  ],
};

