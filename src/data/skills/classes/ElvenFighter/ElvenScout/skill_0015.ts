import { SkillDefinition } from "../../../types";

// Charm - charms the enemy to decrease its desire to attack player
export const skill_0015: SkillDefinition = {
  id: 15,
  code: "ES_0015",
  name: "Charm",
  description: "Charms the enemy to decrease its desire to attack player.\n\nОчаровывает врага, уменьшая его желание атаковать игрока. Сила 132-239 (зависит от уровня). Длительность 60 сек. Перезарядка 60 сек.",
  icon: "/skills/skill0015.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 60,
  duration: 60,
  effects: [], // Aggression reduction is handled by game logic, not by stat modifiers
  levels: [
    { level: 1, requiredLevel: 20, spCost: 950, mpCost: 37, power: 132 },
    { level: 2, requiredLevel: 20, spCost: 950, mpCost: 38, power: 137 },
    { level: 3, requiredLevel: 20, spCost: 950, mpCost: 39, power: 143 },
    { level: 4, requiredLevel: 24, spCost: 1700, mpCost: 40, power: 153 },
    { level: 5, requiredLevel: 24, spCost: 1700, mpCost: 42, power: 159 },
    { level: 6, requiredLevel: 24, spCost: 1700, mpCost: 43, power: 164 },
    { level: 7, requiredLevel: 28, spCost: 3100, mpCost: 47, power: 176 },
    { level: 8, requiredLevel: 28, spCost: 3100, mpCost: 48, power: 182 },
    { level: 9, requiredLevel: 28, spCost: 3100, mpCost: 49, power: 188 },
    { level: 10, requiredLevel: 32, spCost: 5100, mpCost: 53, power: 200 },
    { level: 11, requiredLevel: 32, spCost: 5100, mpCost: 54, power: 206 },
    { level: 12, requiredLevel: 32, spCost: 5100, mpCost: 55, power: 213 },
    { level: 13, requiredLevel: 36, spCost: 8600, mpCost: 59, power: 225 },
    { level: 14, requiredLevel: 36, spCost: 8600, mpCost: 60, power: 232 },
    { level: 15, requiredLevel: 36, spCost: 8600, mpCost: 63, power: 239 },
  ],
};

