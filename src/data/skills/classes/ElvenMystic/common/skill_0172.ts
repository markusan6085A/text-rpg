import { SkillDefinition } from "../../../types";

// Common Craft - allows reading common recipe books
export const skill_0172: SkillDefinition = {
  id: 172,
  code: "EM_0172",
  name: "Common Craft",
  description: "Can read common recipe books.\n\nПозволяет читать книги рецептов обычного уровня. Пассивный навык.",
  icon: "/skills/Skill0172_0.jpg",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 0 },
  ],
};

