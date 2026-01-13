import { SkillDefinition } from "../../../types";

export const Skill_0121: SkillDefinition = {
  id: 121,
  code: "OR_0121",
  name: "Battle Roar",
  description: "Temporarily increases maximum HP and restores HP. Effect 2.\n\nВременно увеличивает максимальное HP и восстанавливает HP.",
  icon: "/skills/skill0121.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 600,
  duration: 600,
  effects: [
    { stat: "maxHp", mode: "multiplier", multiplier: 1.15 },
  ],
  levels: [
    { level: 2, requiredLevel: 40, spCost: 33000, mpCost: 18, power: 15 }, // power: 15 = 15% для миттєвого відновлення HP
    { level: 3, requiredLevel: 49, spCost: 82000, mpCost: 22, power: 20 },
    { level: 4, requiredLevel: 58, spCost: 200000, mpCost: 27, power: 25 },
    { level: 5, requiredLevel: 64, spCost: 400000, mpCost: 30, power: 30 },
    { level: 6, requiredLevel: 70, spCost: 720000, mpCost: 33, power: 35 },
  ],
};

