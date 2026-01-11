import { SkillDefinition } from "../../../types";

export const Skill_0050: SkillDefinition = {
  id: 50,
  code: "OM_0050",
  name: "Focused Force",
  description: "Gathers up force. Used when one is equipped with a fist type weapon. Can be used up to level 1.\n\nСобирает силу. Используется при экипировке оружия для рукопашного боя. Можно использовать до уровня 1.",
  icon: "/skills/skill0050.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 0.9,
  cooldown: 1,
  hpCost: 20,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 24, spCost: 10000, mpCost: 7, power: 1 },
    { level: 2, requiredLevel: 32, spCost: 29000, mpCost: 7, power: 2 },
  ],
};

