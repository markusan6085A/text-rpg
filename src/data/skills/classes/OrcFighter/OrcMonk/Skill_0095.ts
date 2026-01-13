import { SkillDefinition } from "../../../types";

export const Skill_0095: SkillDefinition = {
  id: 95,
  code: "OM_0095",
  name: "Cripple",
  description: "Temporarily reduces target's speed. Usable when a fist weapon is equipped.\n\nВременно уменьшает скорость цели. Используется при экипировке оружия для рукопашного боя.",
  icon: "/skills/skill0095.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.604,
  cooldown: 7,
  effects: [
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.7, chance: 80, duration: 2 },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 5300, mpCost: 19, power: 0 },
    { level: 2, requiredLevel: 24, spCost: 10000, mpCost: 22, power: 0 },
    { level: 3, requiredLevel: 28, spCost: 17000, mpCost: 25, power: 0 },
    { level: 4, requiredLevel: 32, spCost: 29000, mpCost: 28, power: 0 },
    { level: 5, requiredLevel: 36, spCost: 39000, mpCost: 31, power: 0 },
  ],
};

