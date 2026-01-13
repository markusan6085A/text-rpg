import { SkillDefinition } from "../../../types";

export const Skill_0075: SkillDefinition = {
  id: 75,
  code: "WR_0075",
  name: "Detect Insect Weakness",
  description: "Temporarily increases P. Atk. against insects.\n\nВременно увеличивает физ. атаку против насекомых.",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  stackType: "self_p_atk",
  stackOrder: 1,
  effects: [{ stat: "pAtk", mode: "percent" }],
  duration: 600,
  icon: "/skills/0075.jpg",
  levels: [
    { level: 1, requiredLevel: 32, spCost: 18000, mpCost: 14, power: 30 },
  ],
};

