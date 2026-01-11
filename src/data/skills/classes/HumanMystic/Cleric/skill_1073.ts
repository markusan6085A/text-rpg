import { SkillDefinition } from "../../../types";

export const skill_1073: SkillDefinition = {
  id: 1073,
  code: "HM_1073",
  name: "Kiss of Eva",
  description: "Temporarily increases lung capacity. Effect 1.\n\nВременно увеличивает емкость легких. Эффект 1. Длительность: 20 мин.",
  icon: "/skills/skill1073.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  effects: [{ stat: "breathGauge", mode: "multiplier", value: 5 }],
  stackType: "kiss_of_eva",
  stackOrder: 1,
  levels: [{ level: 1, requiredLevel: 20, spCost: 3300, mpCost: 20, power: 5 }],
};

