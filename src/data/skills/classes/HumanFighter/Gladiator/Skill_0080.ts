import { SkillDefinition } from "../../../types";

// Detect Beast Weakness -  .   /.
export const Skill_0080: SkillDefinition = {
  id: 80,
  code: "GL_0080",
  name: "Detect Beast Weakness",
  description: "Описание умения.\n\nОбнаружение слабости зверя. Увеличивает физ. атаку против зверей.",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  duration: 600,
  cooldown: 2,
  icon: "/skills/0080.jpg",
  effects: [{ stat: "pAtk", mode: "percent" }],
  levels: [
    { level: 1, requiredLevel: 52, spCost: 100000, mpCost: 24, power: 30 },
  ],
};

