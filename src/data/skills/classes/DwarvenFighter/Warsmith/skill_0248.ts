import { SkillDefinition } from "../../../types";

// Crystallize - makes crystallization possible (continuation from Artisan)
// XML: levels="5", no power values
export const skill_0248: SkillDefinition = {
  id: 248,
  code: "WS_0248",
  name: "Crystallize",
  description: "Makes crystallization possible.\n\nПозволяет кристаллизовать предметы уровня C, B, A, S.",
  icon: "/skills/skill0248.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  levels: [
    { level: 2, requiredLevel: 40, spCost: 43000, mpCost: 0, power: 0 },
    { level: 3, requiredLevel: 52, spCost: 170000, mpCost: 0, power: 0 },
    { level: 4, requiredLevel: 60, spCost: 370000, mpCost: 0, power: 0 },
    { level: 5, requiredLevel: 70, spCost: 850000, mpCost: 0, power: 0 },
  ],
};

