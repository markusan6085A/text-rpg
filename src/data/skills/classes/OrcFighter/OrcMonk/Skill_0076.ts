import { SkillDefinition } from "../../../types";

export const Skill_0076: SkillDefinition = {
  id: 76,
  code: "OM_0076",
  name: "Totem Spirit Bear",
  description: "Projects the spirit of the bear. Temporarily reduces Speed and increases P. Atk.\n\nПроецирует дух медведя. Временно уменьшает скорость и увеличивает физ. атаку.",
  icon: "/skills/skill0076.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 120,
  duration: 300,
  stackType: "totem_spirit",
  effects: [
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.7, duration: 300 },
    { stat: "pAtk", mode: "multiplier", multiplier: 1.2, duration: 300 },
    { stat: "critDamage", mode: "multiplier", multiplier: 1.2, duration: 300 },
  ],
  levels: [
    { level: 1, requiredLevel: 28, spCost: 17000, mpCost: 2, power: 0 },
  ],
};

