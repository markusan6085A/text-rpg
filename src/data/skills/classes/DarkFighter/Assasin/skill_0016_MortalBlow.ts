import { SkillDefinition } from "../../../types";

// Mortal Blow - potentially deadly attack (continuation from common)
export const skill_0016_MortalBlow: SkillDefinition = {
  id: 16,
  code: "AS_0016",
  name: "Mortal Blow",
  description: "A potentially deadly attack. This skill may only be used when a dagger is equipped.\n\nПотенциально смертельная атака. Этот навык можно использовать только при экипировке кинжала.",
  icon: "/skills/skill0016.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.08,
  cooldown: 11,
  levels: [
    { level: 10, requiredLevel: 20, spCost: 1000, mpCost: 19, power: 268 },
    { level: 11, requiredLevel: 20, spCost: 1000, mpCost: 20, power: 291 },
    { level: 12, requiredLevel: 20, spCost: 1000, mpCost: 20, power: 314 },
    { level: 13, requiredLevel: 24, spCost: 1700, mpCost: 21, power: 367 },
    { level: 14, requiredLevel: 24, spCost: 1700, mpCost: 22, power: 396 },
    { level: 15, requiredLevel: 24, spCost: 1700, mpCost: 23, power: 427 },
    { level: 16, requiredLevel: 28, spCost: 2900, mpCost: 25, power: 494 },
    { level: 17, requiredLevel: 28, spCost: 2900, mpCost: 26, power: 531 },
    { level: 18, requiredLevel: 28, spCost: 2900, mpCost: 27, power: 571 },
    { level: 19, requiredLevel: 32, spCost: 4800, mpCost: 28, power: 656 },
    { level: 20, requiredLevel: 32, spCost: 4800, mpCost: 28, power: 703 },
    { level: 21, requiredLevel: 32, spCost: 4800, mpCost: 29, power: 752 },
    { level: 22, requiredLevel: 36, spCost: 7400, mpCost: 32, power: 859 },
    { level: 23, requiredLevel: 36, spCost: 7400, mpCost: 33, power: 916 },
    { level: 24, requiredLevel: 36, spCost: 7400, mpCost: 34, power: 977 },
  ],
};

