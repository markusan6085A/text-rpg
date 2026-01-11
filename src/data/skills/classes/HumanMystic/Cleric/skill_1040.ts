import { SkillDefinition } from "../../../types";

export const skill_1040: SkillDefinition = {
  id: 1040,
  code: "HM_1040",
  name: "Shield",
  description: "Temporarily increases P. Def. Effect 2.\n\nВременно увеличивает физ. защиту. Эффект 2. Длительность: 20 мин.",
  icon: "/skills/Skill1040_0.jpg",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [{ stat: "pDef", mode: "multiplier", value: 1.12 }],
  stackType: "pDef",
  stackOrder: 1.12,
  levels: [
    { level: 2, requiredLevel: 25, spCost: 6900, mpCost: 23, power: 1.08 },
  ],
};

