import { SkillDefinition } from "../../../types";

// Expand Dwarven Craft - expands dwarven recipe book
// XML: #power: 6 12 18 24 30 36 42 48
// Increases the number of recipes that can be recorded in Dwarven-only recipe books
export const skill_1368: SkillDefinition = {
  id: 1368,
  code: "DF_1368",
  name: "Expand Dwarven Craft",
  description: "Increases the number of recipes that can be recorded in Dwarven-only recipe books.\n\nУвеличивает количество рецептов, которые можно записать в книгу рецептов гномов.",
  icon: "/skills/skill1368.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  // Recipe limit is handled by game logic, not by stat modifiers
  levels: [
    { level: 1, requiredLevel: 5, spCost: 0, mpCost: 0, power: 6 },
    { level: 2, requiredLevel: 20, spCost: 0, mpCost: 0, power: 12 },
  ],
};

