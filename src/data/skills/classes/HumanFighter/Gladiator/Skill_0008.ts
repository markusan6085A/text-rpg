import { SkillDefinition } from "../../../types";

// Sonic Focus       .
export const Skill_0008: SkillDefinition = {
  id: 8,
  code: "GL_0008",
  name: "Sonic Focus",
  description: "Описание умения.\n\nЗвуковая концентрация. Накопление звуковой силы для использования в других скілах.",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  cooldown: 0,
  icon: "/skills/0008.jpg",
  levels: [
    { level: 1, requiredLevel: 40, spCost: 30000, mpCost: 5, power: 1.0 },
    { level: 2, requiredLevel: 43, spCost: 32000, mpCost: 5, power: 2.0 },
    { level: 3, requiredLevel: 49, spCost: 61000, mpCost: 5, power: 3.0 },
    { level: 4, requiredLevel: 55, spCost: 138000, mpCost: 5, power: 4.0 },
    { level: 5, requiredLevel: 60, spCost: 181000, mpCost: 5, power: 5.0 },
    { level: 6, requiredLevel: 66, spCost: 410000, mpCost: 5, power: 6.0 },
    { level: 7, requiredLevel: 70, spCost: 580000, mpCost: 5, power: 7.0 },
  ],
};

