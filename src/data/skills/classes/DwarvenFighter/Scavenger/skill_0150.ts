import { SkillDefinition } from "../../../types";

// Weight Limit - level 2 (level 1 is in common)
// XML: #rate: 2.0 3.0 10.0
export const skill_0150: SkillDefinition = {
  id: 150,
  code: "SC_0150",
  name: "Weight Limit",
  description: "Triple your weight limit.\n\nУтраивает лимит веса.",
  icon: "/skills/skill0150.gif",
  category: "passive",
  powerType: "multiplier",
  target: "self",
  scope: "single",
  // Weight limit multiplier is handled by game logic, not by stat modifiers
  levels: [
    { level: 2, requiredLevel: 24, spCost: 7700, mpCost: 0, power: 3.0 },
  ],
};

