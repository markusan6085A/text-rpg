import { SkillDefinition } from "../../../types";

// Common Craft - allows reading common recipe books
export const skill_0172: SkillDefinition = {
  id: 172,
  code: "DKF_0172",
  name: "Common Craft",
  description: "Can read common recipe books.\n\nПозволяет читать обычные книги рецептов.",
  icon: "/skills/skill0172.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 0 },
  ],
};

