import { SkillDefinition } from "../../../types";

// Weight Limit - level 3 (levels 1-2 are in common/Scavenger)
// XML: #rate: 2.0 3.0 10.0
export const skill_0150: SkillDefinition = {
  id: 150,
  code: "BH_0150",
  name: "Weight Limit",
  description: "Quadruple the weight limit.\n\nУчетверяет лимит веса.",
  icon: "/skills/skill0150.gif",
  category: "passive",
  powerType: "multiplier",
  target: "self",
  scope: "single",
  // Weight limit multiplier is handled by game logic, not by stat modifiers
  levels: [
    { level: 3, requiredLevel: 46, spCost: 67000, mpCost: 0, power: 10.0 },
  ],
};

