import { SkillDefinition } from "../../../types";

// Crystallize - makes crystallization possible
// XML: levels="5", no power values
export const skill_0248: SkillDefinition = {
  id: 248,
  code: "AR_0248",
  name: "Crystallize",
  description: "Makes crystallization possible.\n\nПозволяет кристаллизовать предметы уровня D.",
  icon: "/skills/skill0248.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3700, mpCost: 0, power: 0 },
  ],
};

