import { SkillDefinition } from "../../../types";

// Fast Spell Casting
export const skill_0228: SkillDefinition = {
  id: 228,
  code: "HM_0228",
  name: "Fast Spell Casting",
  description: "Spell casting speed increases.\n\nУвеличивает скорость каста заклинаний.",
  icon: "/skills/skill0228.gif",
  category: "passive",
  powerType: "multiplier",
  target: "self",
  scope: "single",
  effects: [{ stat: "castSpeed", mode: "multiplier" }],
  levels: [
    { level: 1, requiredLevel: 25, spCost: 5500, mpCost: 0, power: 1.05 },
    { level: 2, requiredLevel: 35, spCost: 18000, mpCost: 0, power: 1.07 },
    { level: 3, requiredLevel: 44, spCost: 41000, mpCost: 0, power: 1.1 },
  ],
};
