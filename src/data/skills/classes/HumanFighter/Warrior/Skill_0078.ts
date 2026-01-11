import { SkillDefinition } from "../../../types";

export const Skill_0078: SkillDefinition = {
  id: 78,
  code: "WR_0078",
  name: "War Cry",
  description: "Momentarily increases P. Atk. Effect 1.\n\nМоментально увеличивает физ. атаку. Эффект 1.",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  stackType: "self_p_atk",
  stackOrder: 2,
  effects: [{ stat: "pAtk", mode: "percent" }],
  duration: 60,
  cooldown: 45,
  icon: "/skills/0078.jpg",
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3700, mpCost: 10, power: 20 },
  ],
};

