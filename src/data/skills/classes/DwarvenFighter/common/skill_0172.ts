import { SkillDefinition } from "../../../types";

// Create Item - allows manufacturing level 1 items
export const skill_0172: SkillDefinition = {
  id: 172,
  code: "DF_0172",
  name: "Create Item",
  description: "Level 1 items can be manufactured.\n\nПозволяет создавать предметы 1 уровня.",
  icon: "/skills/skill0172.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  levels: [
    { level: 1, requiredLevel: 5, spCost: 310, mpCost: 0, power: 0 },
  ],
};

