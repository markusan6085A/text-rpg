import { SkillDefinition } from "../../../types";

// Create Common Item - allows manufacturing level 1 items
export const skill_1320: SkillDefinition = {
  id: 1320,
  code: "DKF_1320",
  name: "Create Common Item",
  description: "Creates level 1 common items.\n\nПозволяет создавать обычные предметы 1 уровня.",
  icon: "/skills/skill1320.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  levels: [
    { level: 1, requiredLevel: 5, spCost: 0, mpCost: 0, power: 0 },
  ],
};

