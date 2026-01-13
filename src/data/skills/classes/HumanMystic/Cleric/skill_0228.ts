import { SkillDefinition } from "../../../types";

export const skill_0228: SkillDefinition = {
  id: 228,
  code: "HM_0228",
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
  levels: [{ level: 1, requiredLevel: 25, spCost: 6900, mpCost: 0, power: 5 }],
};

