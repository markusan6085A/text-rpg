import { SkillDefinition } from "../../../types";

// War Cry -   .  ( 2   ).
export const Skill_0078: SkillDefinition = {
  id: 78,
  code: "GL_0078",
  name: "War Cry",
  description: "Momentarily increases P. Atk. Effect 1.\n\nМоментально увеличивает физ. атаку. Эффект 1.",
  category: "buff",
  powerType: "percent",
  target: "party",
  scope: "single",
  duration: 60,
  cooldown: 45,
  icon: "/skills/0078.jpg",
  effects: [{ stat: "pAtk", mode: "percent" }],
  levels: [
    { level: 2, requiredLevel: 43, spCost: 61000, mpCost: 19, power: 25 },
  ],
};

