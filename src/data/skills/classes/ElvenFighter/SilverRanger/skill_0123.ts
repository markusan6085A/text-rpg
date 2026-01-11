import { SkillDefinition } from "../../../types";

// Spirit Barrier - temporarily increases M. Def
export const skill_0123: SkillDefinition = {
  id: 123,
  code: "SR_0123",
  name: "Spirit Barrier",
  description: "Temporarily increases M. Def. Effect 1-3.\n\nВременно увеличивает магическую защиту на 15%-30% на 20 мин (зависит от уровня).",
  icon: "/skills/skill0123.gif",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  stackType: "spirit_barrier",
  effects: [
    { stat: "mDef", mode: "multiplier" }, // Value from level.power (1.15, 1.23, 1.3)
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 35000, mpCost: 35, power: 1.15 }, // 15% increase
    { level: 2, requiredLevel: 49, spCost: 89000, mpCost: 44, power: 1.23 }, // 23% increase
    { level: 3, requiredLevel: 58, spCost: 210000, mpCost: 54, power: 1.3 }, // 30% increase
  ],
};

