import { SkillDefinition } from "../../../types";

// Fast Spell Casting - spell casting speed increases (continues from Elven Wizard level 1)
export const skill_0228: SkillDefinition = {
  id: 228,
  code: "ES_0228",
  name: "Fast Spell Casting",
  description: "Spell casting speed increases.\n\nУвеличивает скорость каста заклинаний на 7-10% (зависит от уровня).",
  icon: "/skills/skill0228.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "castSpeed", mode: "percent" }, // Value from level.power
  ],
  levels: [
    { level: 2, requiredLevel: 40, spCost: 28000, mpCost: 0, power: 7 },
    { level: 3, requiredLevel: 56, spCost: 95000, mpCost: 0, power: 10 },
  ],
};

