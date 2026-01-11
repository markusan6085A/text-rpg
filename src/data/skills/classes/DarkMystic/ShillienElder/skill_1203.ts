import { SkillDefinition } from "../../../types";

const levels = [
  { level: 2, requiredLevel: 40, spCost: 39000, mpCost: 0, power: 7 },
  { level: 3, requiredLevel: 56, spCost: 140000, mpCost: 0, power: 10 }
];

export const skill_1203: SkillDefinition = {
  id: 228,
  code: "DME_0228",
  name: "Fast Spell Casting",
  description: "Increases spell casting speed.\n\nУвеличивает скорость каста заклинаний.",
  icon: "/skills/skill0228.gif",
  category: "passive",
  powerType: "percent",
  target: "self",
  scope: "single",
  effects: [{ stat: "castSpeed", mode: "percent" }],
  stackType: "fast_spell_casting",
  stackOrder: 1,
  levels,
};
