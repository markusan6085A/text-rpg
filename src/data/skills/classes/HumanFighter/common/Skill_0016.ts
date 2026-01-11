import { SkillDefinition } from "../../../types";

export const Skill_0016: SkillDefinition = {
  id: 16,
  code: "HF_0016",
  name: "Mortal Blow",
  description: "A potentially deadly attack. This skill may only be used when a dagger is equipped.\n\nПотенциально смертельная атака. Этот навык можно использовать только при экипированном кинжале.",
  icon: "/skills/Skill0016.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.08,
  cooldown: 11,
  levels: [
    { level: 1, requiredLevel: 3, spCost: 0, mpCost: 9, power: 73 },
    { level: 2, requiredLevel: 4, spCost: 0, mpCost: 9, power: 80 },
    { level: 3, requiredLevel: 5, spCost: 0, mpCost: 10, power: 88 },
    { level: 4, requiredLevel: 8, spCost: 0, mpCost: 11, power: 115 },
    { level: 5, requiredLevel: 9, spCost: 0, mpCost: 12, power: 126 },
    { level: 6, requiredLevel: 10, spCost: 0, mpCost: 13, power: 137 },
    { level: 7, requiredLevel: 13, spCost: 0, mpCost: 16, power: 178 },
    { level: 8, requiredLevel: 14, spCost: 0, mpCost: 16, power: 193 },
    { level: 9, requiredLevel: 15, spCost: 0, mpCost: 17, power: 210 },
  ],
};

