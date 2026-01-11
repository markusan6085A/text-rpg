import { SkillDefinition } from "../../../types";

// Sonic Mastery     / .
export const Skill_0992: SkillDefinition = {
  id: 992,
  code: "GL_0992",
  name: "Sonic Mastery",
  description: "Описание умения.\n\nМастерство звука. Увеличивает вампиризм.",
  category: "passive",
  powerType: "percent",
  icon: "/skills/0992.jpg",
  effects: [{ stat: "vampirism", mode: "percent" }],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 30000, mpCost: 0, power: 15 },
    { level: 2, requiredLevel: 43, spCost: 32000, mpCost: 0, power: 15 },
    { level: 3, requiredLevel: 49, spCost: 61000, mpCost: 0, power: 15 },
    { level: 4, requiredLevel: 55, spCost: 138000, mpCost: 0, power: 15 },
    { level: 5, requiredLevel: 60, spCost: 181000, mpCost: 0, power: 15 },
    { level: 6, requiredLevel: 66, spCost: 410000, mpCost: 0, power: 15 },
    { level: 7, requiredLevel: 70, spCost: 580000, mpCost: 0, power: 15 },
  ],
};

