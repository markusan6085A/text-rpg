import { SkillDefinition } from "../../../types";

// Drain Health - transfers HP from opponent to yourself (continuation from common)
export const skill_0070_DrainHealth: SkillDefinition = {
  id: 70,
  code: "AS_0070",
  name: "Drain Health",
  description: "Transfers HP from an opponent to yourself. Absorbs 20% of damage dealt.\n\nПереводит HP от противника к себе. Поглощает 20% нанесенного урона.",
  icon: "/skills/skill0070.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 3,
  cooldown: 15,
  effects: [
    { stat: "vampirism", mode: "percent", value: 20 },
  ],
  levels: [
    { level: 3, requiredLevel: 20, spCost: 1500, mpCost: 14, power: 24 },
    { level: 4, requiredLevel: 20, spCost: 1500, mpCost: 15, power: 26 },
    { level: 5, requiredLevel: 24, spCost: 1700, mpCost: 15, power: 28 },
    { level: 6, requiredLevel: 24, spCost: 1700, mpCost: 17, power: 29 },
    { level: 7, requiredLevel: 24, spCost: 1700, mpCost: 17, power: 31 },
    { level: 8, requiredLevel: 28, spCost: 2900, mpCost: 18, power: 33 },
    { level: 9, requiredLevel: 28, spCost: 2900, mpCost: 19, power: 34 },
    { level: 10, requiredLevel: 28, spCost: 2900, mpCost: 19, power: 35 },
    { level: 11, requiredLevel: 32, spCost: 4800, mpCost: 20, power: 38 },
    { level: 12, requiredLevel: 32, spCost: 4800, mpCost: 20, power: 39 },
    { level: 13, requiredLevel: 32, spCost: 4800, mpCost: 22, power: 40 },
    { level: 14, requiredLevel: 36, spCost: 7400, mpCost: 23, power: 43 },
    { level: 15, requiredLevel: 36, spCost: 7400, mpCost: 23, power: 44 },
    { level: 16, requiredLevel: 36, spCost: 7400, mpCost: 24, power: 46 },
  ],
};

