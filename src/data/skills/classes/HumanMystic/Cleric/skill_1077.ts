import { SkillDefinition } from "../../../types";

export const skill_1077: SkillDefinition = {
  id: 1077,
  code: "HM_1077",
  name: "Focus",
  description: "Temporarily increases critical attack rate.\n\nВременно увеличивает шанс критической атаки.",
  icon: "/skills/skill1077.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200, // 20 minutes
  effects: [{ stat: "critRate", mode: "percent", value: 30 }],
  stackType: "focus",
  stackOrder: 1,
  levels: [{ level: 1, requiredLevel: 25, spCost: 6900, mpCost: 23, power: 0.2 }],
};

