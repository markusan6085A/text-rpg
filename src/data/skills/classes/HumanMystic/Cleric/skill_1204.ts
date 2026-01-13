import { SkillDefinition } from "../../../types";

export const skill_1204: SkillDefinition = {
  id: 1204,
  code: "HM_1204",
  name: "Wind Walk",
  description: "Temporarily increases Speed. Effect 1.\n\nВременно увеличивает скорость передвижения. Эффект 1. Длительность: 20 мин.",
  icon: "/skills/skill1204.gif",
  category: "buff",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  effects: [{ stat: "runSpeed", mode: "flat" }],
  stackType: "SpeedUp",
  stackOrder: 20,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 20, power: 20 },
    { level: 2, requiredLevel: 30, spCost: 13000, mpCost: 27, power: 33 },
  ],
};

