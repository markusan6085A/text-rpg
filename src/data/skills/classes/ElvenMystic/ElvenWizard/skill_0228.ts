import { SkillDefinition } from "../../../types";

// Fast Spell Casting - spell casting speed increases
export const skill_0228: SkillDefinition = {
  id: 228,
  code: "EW_0228",
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
    { level: 1, requiredLevel: 25, spCost: 6100, mpCost: 0, power: 5 },
  ],
};

