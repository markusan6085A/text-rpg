import { SkillDefinition } from "../../../types";

export const Skill_0003: SkillDefinition = {
  id: 3,
  code: "HF_0003",
  name: "Mortal Blow",
  description: "A potentially deadly attack. This skill may only be used when a dagger is equipped. Power 73.\n\nПотенциально смертельная атака. Этот скіл можно использовать только при экипировке кинжала. Сила 73.",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  cooldown: 3,
  icon: "/skills/0003.jpg",
  levels: [
    { level: 1, requiredLevel: 5, spCost: 50, mpCost: 8, power: 73 },
    { level: 2, requiredLevel: 5, spCost: 50, mpCost: 9, power: 88 },
    { level: 3, requiredLevel: 5, spCost: 50, mpCost: 10, power: 102 },
    { level: 4, requiredLevel: 10, spCost: 370, mpCost: 10, power: 115 },
    { level: 5, requiredLevel: 10, spCost: 370, mpCost: 11, power: 126 },
    { level: 6, requiredLevel: 10, spCost: 370, mpCost: 11, power: 137 },
    { level: 7, requiredLevel: 15, spCost: 1300, mpCost: 14, power: 178 },
    { level: 8, requiredLevel: 15, spCost: 1300, mpCost: 15, power: 205 },
    { level: 9, requiredLevel: 15, spCost: 1300, mpCost: 15, power: 210 },
  ],
};

