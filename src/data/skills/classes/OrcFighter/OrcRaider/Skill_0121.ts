import { SkillDefinition } from "../../../types";

export const Skill_0121: SkillDefinition = {
  id: 121,
  code: "OR_0121",
  name: "Battle Roar",
  description: "Temporarily increases maximum HP by +10% and immediately restores +10% HP. Effect 1.\n\nВременно увеличивает максимальное HP на +10% и сразу восстанавливает +10% HP.",
  icon: "/skills/skill0121.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 600,
  duration: 600,
  effects: [
    { stat: "maxHp", mode: "multiplier", multiplier: 1.1 },
  ],
  levels: [
    { level: 1, requiredLevel: 28, spCost: 11000, mpCost: 13, power: 10 }, // power: 10 = 10% для миттєвого відновлення HP
  ],
};

