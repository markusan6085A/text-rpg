import { SkillDefinition } from "../../../types";

export const skill_0003: SkillDefinition = {
  id: 3,
  code: "ELF_0003",
  name: "Power Strike",
  description: "Gathers power for a fierce strike. Used when equipped with a sword or blunt weapon. Over-hit is possible. Power 25.\n\nСобирает силу для яростного удара. Требуется меч или дубина. Возможен оверхит. Сила 25.",
  icon: "/skills/skill0003.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.08,
  cooldown: 13,
  levels: [
    { level: 1, requiredLevel: 5, spCost: 50, mpCost: 10, power: 25 },
    { level: 2, requiredLevel: 5, spCost: 50, mpCost: 10, power: 27 },
    { level: 3, requiredLevel: 5, spCost: 50, mpCost: 11, power: 30 },
    { level: 4, requiredLevel: 10, spCost: 310, mpCost: 13, power: 39 },
    { level: 5, requiredLevel: 10, spCost: 310, mpCost: 13, power: 42 },
    { level: 6, requiredLevel: 10, spCost: 310, mpCost: 14, power: 46 },
    { level: 7, requiredLevel: 15, spCost: 1100, mpCost: 17, power: 60 },
    { level: 8, requiredLevel: 15, spCost: 1100, mpCost: 18, power: 65 },
    { level: 9, requiredLevel: 15, spCost: 1100, mpCost: 19, power: 70 },
  ],
};

