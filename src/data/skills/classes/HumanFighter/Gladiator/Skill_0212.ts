import { SkillDefinition } from "../../../types";

// Fast HP Recovery
export const Skill_0212: SkillDefinition = {
  id: 212,
  code: "GL_0212",
  name: "Fast HP Recovery",
  description: "Increases HP recovery speed.\n\nУвеличивает скорость восстановления HP на 1.7-4.0 (зависит от уровня). Пассивный навык.",
  category: "passive",
  powerType: "flat",
  icon: "/skills/0212.jpg",
  effects: [{ stat: "hpRegen", mode: "flat" }],
  levels: [
    { level: 3, requiredLevel: 40, spCost: 30000, mpCost: 0, power: 1.7 },
    { level: 4, requiredLevel: 46, spCost: 43000, mpCost: 0, power: 2.1 },
    { level: 5, requiredLevel: 52, spCost: 100000, mpCost: 0, power: 2.6 },
    { level: 6, requiredLevel: 58, spCost: 153000, mpCost: 0, power: 2.7 },
    { level: 7, requiredLevel: 66, spCost: 490000, mpCost: 0, power: 3.4 },
    { level: 8, requiredLevel: 74, spCost: 1630000, mpCost: 0, power: 4.0 },
  ],
};

