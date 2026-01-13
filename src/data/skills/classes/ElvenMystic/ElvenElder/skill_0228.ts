import { SkillDefinition } from "../../../types";

// Fast Spell Casting - spell casting speed increases (continuation for Elven Elder)
// З XML: levels="3", rate: 1.05-1.1
// Для Elven Elder: рівень 2-3 (requiredLevel: 40, 56)
export const skill_0228: SkillDefinition = {
  id: 228,
  code: "EE_0228",
  name: "Fast Spell Casting",
  description: "Spell casting speed increases.\n\nУвеличивает скорость каста заклинаний на 7-10% (зависит от уровня).",
  icon: "/skills/skill0228.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "castSpeed", mode: "percent" },
  ],
  levels: [
    { level: 2, requiredLevel: 40, spCost: 34000, mpCost: 0, power: 7 },
    { level: 3, requiredLevel: 56, spCost: 110000, mpCost: 0, power: 10 },
  ],
};













