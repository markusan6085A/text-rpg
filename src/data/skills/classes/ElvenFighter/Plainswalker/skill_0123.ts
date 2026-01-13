import { SkillDefinition } from "../../../types";

// Spirit Barrier - temporarily increases M. Def.
export const skill_0123: SkillDefinition = {
  id: 123,
  code: "PW_0123",
  name: "Spirit Barrier",
  description: "Temporarily increases M. Def. Effect 1-3.\n\nВременно увеличивает магическую защиту на 15%-30% на 20 сек. (зависит от уровня).",
  icon: "/skills/skill0123.gif",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 20,
  effects: [
    { stat: "mDef", mode: "percent" }, // Value from level.power
  ],
  stackType: "spirit_barrier",
  stackOrder: 1,
  levels: [
    { level: 1, requiredLevel: 40, spCost: 28000, mpCost: 35, power: 15 },
    { level: 2, requiredLevel: 49, spCost: 75000, mpCost: 44, power: 23 },
    { level: 3, requiredLevel: 58, spCost: 200000, mpCost: 54, power: 30 },
  ],
};

