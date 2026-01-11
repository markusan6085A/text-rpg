import { SkillDefinition } from "../../../types";

// Common Craft / Create Common Item basic crafting access
export const skill_0172: SkillDefinition = {
  id: 172,
  code: "HM_0172",
  name: "Common Craft",
  description: "Allows reading recipe books of common level.\n\nПозволяет читать книги рецептов обычного уровня. Пассивный навык.",
  icon: "/skills/Skill0172_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 0 },
    { level: 2, requiredLevel: 5, spCost: 500, mpCost: 0, power: 0 },
  ],
};


