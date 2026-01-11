import { SkillDefinition } from "../../../types";

// Fast Spell Casting - 3 levels from XML (passive)
// rate: 1.05, 1.07, 1.10 (multipliers for castSpeed)
export const skill_0228: SkillDefinition = {
  id: 228,
  code: "DMO_0228",
  name: "Fast Spell Casting",
  description: "Increases spell casting speed.\n\nУвеличивает скорость каста заклинаний.",
  icon: "/skills/skill0228.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "castSpeed", mode: "multiplier" }], // Value from level.power (rate)
  stackType: "fast_spell_casting",
  stackOrder: 1,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 0, power: 1.05 },
    { level: 2, requiredLevel: 30, spCost: 12000, mpCost: 0, power: 1.07 },
    { level: 3, requiredLevel: 40, spCost: 30000, mpCost: 0, power: 1.10 },
  ],
};

