import { SkillDefinition } from "../../../types";

// Common Craft - allows reading common recipe books
export const skill_1322: SkillDefinition = {
  id: 1322,
  code: "DF_1322",
  name: "Common Craft",
  description: "Can read common recipe books.\n\nПозволяет читать книги рецептов общего типа.",
  icon: "/skills/skill0172.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 0 },
  ],
};

