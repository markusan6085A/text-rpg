import { SkillDefinition } from "../../../types";

// Fast Spell Casting - spell casting speed increases
// З XML: levels="3", rate: 1.05-1.1
// Для Elven Oracle: рівень 1 (requiredLevel: 25)
export const skill_0228: SkillDefinition = {
  id: 228,
  code: "EO_0228",
  name: "Fast Spell Casting",
  description: "Spell casting speed increases.\n\nУвеличивает скорость каста заклинаний на 5%.",
  icon: "/skills/skill0228.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "castSpeed", mode: "percent", value: 5 },
  ],
  levels: [
    { level: 1, requiredLevel: 25, spCost: 6500, mpCost: 0, power: 5 },
  ],
};

