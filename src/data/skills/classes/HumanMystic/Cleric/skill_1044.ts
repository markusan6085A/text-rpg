import { SkillDefinition } from "../../../types";

export const skill_1044: SkillDefinition = {
  id: 1044,
  code: "HM_1044",
  name: "Regeneration",
  description: "Temporarily increases HP recovery. Effect 1.\n\nВременно увеличивает восстановление HP. Эффект 1. Длительность: 20 мин.",
  icon: "/skills/skill1044.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  effects: [{ stat: "hpRegen", mode: "multiplier", value: 1.1 }],
  stackType: "HPregen",
  stackOrder: 1.1,
  levels: [
    { level: 1, requiredLevel: 35, spCost: 21000, mpCost: 30, power: 1.1 },
  ],
};

