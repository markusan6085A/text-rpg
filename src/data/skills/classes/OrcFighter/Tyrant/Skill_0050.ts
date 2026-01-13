import { SkillDefinition } from "../../../types";

export const Skill_0050: SkillDefinition = {
  id: 50,
  code: "TY_0050",
  name: "Focused Force",
  description: "Gathers up force. Used when one is equipped with a fist type weapon. Can be used up to level 7.\n\nСобирает силу. Используется при экипировке оружия для рукопашного боя. Можно использовать до уровня 7.",
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
    { level: 3, requiredLevel: 40, spCost: 39000, mpCost: 7, power: 3 },
    { level: 4, requiredLevel: 52, spCost: 150000, mpCost: 7, power: 4 },
    { level: 5, requiredLevel: 58, spCost: 290000, mpCost: 7, power: 5 },
    { level: 6, requiredLevel: 64, spCost: 700000, mpCost: 7, power: 6 },
    { level: 7, requiredLevel: 70, spCost: 1400000, mpCost: 7, power: 7 },
  ],
};

