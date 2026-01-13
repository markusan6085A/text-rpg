import { SkillDefinition } from "../../../types";

// Fast Spell Casting - 3 levels from XML (passive)
// rate: 1.05, 1.07, 1.10 (multipliers for castSpeed)
export const skill_0228: SkillDefinition = {
  id: 228,
  code: "DW_0228",
  name: "Fast Spell Casting",
  description: "Spell casting speed increases.\n\nУвеличивает скорость каста на 5-10%.",
  icon: "/skills/skill0228.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "castSpeed", mode: "multiplier" }], // Value from level.power (rate)
  stackType: "fast_spell_casting",
  stackOrder: 1,
  levels: [
    { level: 1, requiredLevel: 25, spCost: 5800, mpCost: 0, power: 1.05 },
    { level: 2, requiredLevel: 35, spCost: 18000, mpCost: 0, power: 1.07 },
    { level: 3, requiredLevel: 45, spCost: 50000, mpCost: 0, power: 1.10 },
  ],
};

