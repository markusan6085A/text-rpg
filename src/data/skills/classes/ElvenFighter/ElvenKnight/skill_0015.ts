import { SkillDefinition } from "../../../types";

// Charm - charms the enemy to decrease its desire to attack player
export const skill_0015: SkillDefinition = {
  id: 15,
  code: "EK_0015",
  name: "Charm",
  description: "Charms the enemy to decrease its desire to attack player. Power 132.\n\nОчаровывает врага, уменьшая его желание атаковать игрока.",
  icon: "/skills/skill0015.gif",
  category: "debuff",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 60,
  chance: 80,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1400, mpCost: 37, power: 132 },
    { level: 2, requiredLevel: 20, spCost: 1400, mpCost: 38, power: 137 },
    { level: 3, requiredLevel: 20, spCost: 1400, mpCost: 39, power: 143 },
    { level: 4, requiredLevel: 24, spCost: 2900, mpCost: 40, power: 153 },
    { level: 5, requiredLevel: 24, spCost: 2900, mpCost: 42, power: 159 },
    { level: 6, requiredLevel: 24, spCost: 2900, mpCost: 43, power: 164 },
    { level: 7, requiredLevel: 28, spCost: 5000, mpCost: 47, power: 176 },
    { level: 8, requiredLevel: 28, spCost: 5000, mpCost: 48, power: 182 },
    { level: 9, requiredLevel: 28, spCost: 5000, mpCost: 49, power: 188 },
    { level: 10, requiredLevel: 32, spCost: 8300, mpCost: 53, power: 200 },
    { level: 11, requiredLevel: 32, spCost: 8300, mpCost: 54, power: 206 },
    { level: 12, requiredLevel: 32, spCost: 8300, mpCost: 55, power: 213 },
    { level: 13, requiredLevel: 36, spCost: 13000, mpCost: 59, power: 225 },
    { level: 14, requiredLevel: 36, spCost: 13000, mpCost: 60, power: 232 },
    { level: 15, requiredLevel: 36, spCost: 13000, mpCost: 63, power: 239 },
  ],
};

