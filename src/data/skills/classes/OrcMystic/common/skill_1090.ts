import { SkillDefinition } from "../../../types";

// Life Drain - magic attack skill that absorbs target's HP
export const skill_1090: SkillDefinition = {
  id: 1090,
  code: "OM_1090",
  name: "Life Drain",
  description: "Absorbs target's HP. Power 15.\n\nПоглощает HP цели. Сила 15. 80% урона восстанавливается как HP.",
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
    { level: 1, requiredLevel: 7, spCost: 520, mpCost: 20, power: 15 },
    { level: 2, requiredLevel: 14, spCost: 1800, mpCost: 30, power: 21 },
  ],
};

