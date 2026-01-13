import { SkillDefinition } from "../../../types";

export const Skill_0359: SkillDefinition = {
  id: 359,
  code: "DL_0359",
  name: "Eye of Hunter",
  description: "Temporarily increases P. Atk against insects/plants/animals.\n\nВременно увеличивает физ. атаку против насекомых/растений/животных.",
  category: "buff",
  powerType: "percent",
  duration: 600,
  cooldown: 2,
  icon: "/skills/0359.jpg",
  target: "self",
  scope: "single",
  effects: [{ stat: "pAtk", mode: "percent" }],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 12250000, mpCost: 70, power: 30 },
  ],
};

