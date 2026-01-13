import { SkillDefinition } from "../../../types";

export const skill_1085: SkillDefinition = {
  id: 1085,
  code: "HM_1085",
  name: "Acumen",
  description: "Temporarily increases Casting Spd.\n\nВременно увеличивает скорость каста.",
  icon: "/skills/skill1085.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  effects: [{ stat: "castSpeed", mode: "percent" }], // Value from level.power
  stackType: "acumen",
  stackOrder: 1,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 20, power: 10 }, // +10%
    { level: 2, requiredLevel: 35, spCost: 21000, mpCost: 30, power: 20 }, // +20%
    { level: 3, requiredLevel: 48, spCost: 63000, mpCost: 44, power: 30 }, // +30%
  ],
};

