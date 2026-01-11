import { SkillDefinition } from "../../../types";

export const Skill_0081: SkillDefinition = {
  id: 81,
  code: "TY_0081",
  name: "Punch of Doom",
  description: "Strikes an enemy with an iron fist but temporarily stuns you. Usable when one is equipped with a fist type weapon. Over-hit is possible.\n\nУдаряет врага железным кулаком, но временно оглушает вас. Используется при экипировке оружия для рукопашного боя. Возможен овер-хит.",
  icon: "/skills/skill0081.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.36,
  cooldown: 120,
  hpCost: 399,
  effects: [
    { stat: "stunResist", mode: "flat", chance: 80, duration: 9 },
  ],
  levels: [
    { level: 1, requiredLevel: 58, spCost: 220000, mpCost: 0, power: 4580 },
    { level: 2, requiredLevel: 70, spCost: 480000, mpCost: 0, power: 6332 },
    { level: 3, requiredLevel: 72, spCost: 1400000, mpCost: 0, power: 9132 },
  ],
};

