import { SkillDefinition } from "../../../types";

// Fast Spell Casting - passive skill that increases spell casting speed
export const skill_0228: SkillDefinition = {
  id: 228,
  code: "OS_0228",
  name: "Fast Spell Casting",
  description: "Spell casting speed increases.\n\nУвеличивает скорость каста заклинаний на 5%.",
  icon: "/skills/Skill0228_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "castSpeed", mode: "percent", value: 5 },
  ],
  levels: [
    { level: 1, requiredLevel: 25, spCost: 5800, mpCost: 0, power: 5 },
  ],
};

