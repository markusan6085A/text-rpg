import { SkillDefinition } from "../../../types";

// Spirit Barrier - temporarily increases M. Def
export const skill_0123: SkillDefinition = {
  id: 123,
  code: "SS_0123",
  name: "Spirit Barrier",
  description: "Temporarily increases M. Def. Effect 1.\n\nВременно увеличивает магическую защиту на 15% (уровень 1), 23% (уровень 2), 30% (уровень 3) на 20 мин.",
  icon: "/skills/skill0123.gif",
  category: "buff",
  powerType: "multiplier",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  stackType: "MagicDefUp",
  effects: [
    { stat: "mDef", mode: "multiplier" }, // multiplier from level
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 49000, mpCost: 35, power: 1.15 }, // 15% increase
    { level: 2, requiredLevel: 49, spCost: 120000, mpCost: 44, power: 1.23 }, // 23% increase
    { level: 3, requiredLevel: 58, spCost: 350000, mpCost: 54, power: 1.30 }, // 30% increase
  ],
};

