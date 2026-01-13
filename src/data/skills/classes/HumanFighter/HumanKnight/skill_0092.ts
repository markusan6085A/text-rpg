import { SkillDefinition } from "../../../types";

// Shield Stun для HumanKnight (рівні 1-15)
export const skill_0092: SkillDefinition = {
  id: 92,
  code: "HK_0092",
  name: "Shield Stun",
  description: "A brutal shield bash that stuns your opponent. A shield must be equipped in order to use this skill.\n\nЖестокий удар щитом, который оглушает противника на 5 сек. Шанс: 80%. Сила: 80. Каст: 1.2 сек. Перезарядка: 12 сек. Требуется щит.",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.2,
  cooldown: 12,
  chance: 80,
  icon: "/skills/skill0092.gif",
  effects: [
    { stat: "stunResist", mode: "flat", duration: 5, chance: 80 }, // Stun на 5 секунд з 80% шансом
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1500, mpCost: 22, power: 80 },
    { level: 2, requiredLevel: 20, spCost: 1500, mpCost: 22, power: 80 },
    { level: 3, requiredLevel: 20, spCost: 1500, mpCost: 22, power: 80 },
    { level: 4, requiredLevel: 24, spCost: 3300, mpCost: 23, power: 80 },
    { level: 5, requiredLevel: 24, spCost: 3300, mpCost: 24, power: 80 },
    { level: 6, requiredLevel: 24, spCost: 3300, mpCost: 25, power: 80 },
    { level: 7, requiredLevel: 28, spCost: 4000, mpCost: 27, power: 80 },
    { level: 8, requiredLevel: 28, spCost: 4000, mpCost: 29, power: 80 },
    { level: 9, requiredLevel: 28, spCost: 4000, mpCost: 30, power: 80 },
    { level: 10, requiredLevel: 32, spCost: 8300, mpCost: 31, power: 80 },
    { level: 11, requiredLevel: 32, spCost: 8300, mpCost: 31, power: 80 },
    { level: 12, requiredLevel: 32, spCost: 8300, mpCost: 33, power: 80 },
    { level: 13, requiredLevel: 36, spCost: 13000, mpCost: 35, power: 80 },
    { level: 14, requiredLevel: 36, spCost: 13000, mpCost: 36, power: 80 },
    { level: 15, requiredLevel: 36, spCost: 13000, mpCost: 37, power: 80 },
  ],
};

