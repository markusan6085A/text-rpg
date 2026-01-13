import { SkillDefinition } from "../../../types";

// Aura Bolt - launches a weak bolt of magical energy
export const skill_1275: SkillDefinition = {
  id: 1275,
  code: "ES_1275",
  name: "Aura Bolt",
  description: "Launches a weak bolt of magical energy. MP consumption rate is low and Casting Speed is short. Power 26-48.\n\nЗапускает слабый сгусток магической энергии. Низкий расход MP и короткая скорость каста. Сила 26-48.",
  icon: "/skills/skill1275.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 2,
  cooldown: 3,
  levels: [
    { level: 1, requiredLevel: 40, spCost: 28000, mpCost: 18, power: 26 },
    { level: 2, requiredLevel: 44, spCost: 37000, mpCost: 20, power: 29 },
    { level: 3, requiredLevel: 48, spCost: 60000, mpCost: 23, power: 33 },
    { level: 4, requiredLevel: 52, spCost: 95000, mpCost: 24, power: 36 },
    { level: 5, requiredLevel: 56, spCost: 95000, mpCost: 27, power: 39 },
    { level: 6, requiredLevel: 58, spCost: 120000, mpCost: 28, power: 41 },
    { level: 7, requiredLevel: 60, spCost: 150000, mpCost: 28, power: 43 },
    { level: 8, requiredLevel: 62, spCost: 210000, mpCost: 29, power: 45 },
    { level: 9, requiredLevel: 64, spCost: 250000, mpCost: 30, power: 46 },
    { level: 10, requiredLevel: 66, spCost: 350000, mpCost: 32, power: 48 },
  ],
};

