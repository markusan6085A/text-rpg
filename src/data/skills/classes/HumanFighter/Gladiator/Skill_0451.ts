import { SkillDefinition } from "../../../types";

// Sonic Move -  ,   .
export const Skill_0451: SkillDefinition = {
  id: 451,
  code: "GL_0451",
  name: "Sonic Move",
  description: "Описание умения.\n\nЗвуковое движение. Увеличивает скорость бега.",
  category: "buff",
  powerType: "flat",
  target: "self",
  scope: "single",
  duration: 15,
  cooldown: 30,
  icon: "/skills/0451.jpg",
  effects: [{ stat: "runSpeed", mode: "flat" }],
  levels: [
    { level: 1, requiredLevel: 62, spCost: 250000, mpCost: 29, power: 40 },
    { level: 2, requiredLevel: 68, spCost: 490000, mpCost: 32, power: 66 },
  ],
};

