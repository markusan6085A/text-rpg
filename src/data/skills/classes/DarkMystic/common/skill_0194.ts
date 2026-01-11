import { SkillDefinition } from "../../../types";

// Lucky  death penalty protection for low levels
export const skill_0194: SkillDefinition = {
  id: 194,
  code: "DM_0194",
  name: "Lucky",
  description: "Removes the death penalty and item drop while you are Level 4 and under.",
  icon: "/skills/Skill0194_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  levels: [
    { level: 1, requiredLevel: 1, spCost: 0, mpCost: 0, power: 0 },
  ],
};



