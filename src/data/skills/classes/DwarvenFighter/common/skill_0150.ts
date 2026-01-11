import { SkillDefinition } from "../../../types";

// Weight Limit - doubles weight limit
// XML: #rate: 2.0 3.0 10.0
export const skill_0150: SkillDefinition = {
  id: 150,
  code: "DF_0150",
  name: "Weight Limit",
  description: "Double your weight limit.\n\nУдваивает лимит веса.",
  icon: "/skills/skill0150.gif",
  category: "passive",
  powerType: "multiplier",
  target: "self",
  scope: "single",
  // Weight limit multiplier is handled by game logic, not by stat modifiers
  levels: [
    { level: 1, requiredLevel: 10, spCost: 1100, mpCost: 0, power: 2.0 },
  ],
};

