import { SkillDefinition } from "../../../types";

// Drain Health для HumanKnight (рівні 1-13)
export const skill_0070: SkillDefinition = {
  id: 70,
  code: "HK_0070",
  name: "Drain Health",
  description: "Transfers HP from an opponent to yourself.\n\nПереводит HP от противника к себе. Сила: 20-108 (зависит от уровня). Каст: 3 сек. Перезарядка: 15 сек.",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 3,
  cooldown: 15,
  icon: "/skills/skill0070.gif",
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2300, mpCost: 12, power: 20 },
    { level: 2, requiredLevel: 20, spCost: 2300, mpCost: 13, power: 22 },
    { level: 3, requiredLevel: 24, spCost: 5000, mpCost: 14, power: 24 },
    { level: 4, requiredLevel: 24, spCost: 5000, mpCost: 15, power: 26 },
    { level: 5, requiredLevel: 28, spCost: 4000, mpCost: 15, power: 28 },
    { level: 6, requiredLevel: 28, spCost: 4000, mpCost: 17, power: 29 },
    { level: 7, requiredLevel: 28, spCost: 4000, mpCost: 17, power: 31 },
    { level: 8, requiredLevel: 32, spCost: 8300, mpCost: 18, power: 33 },
    { level: 9, requiredLevel: 32, spCost: 8300, mpCost: 19, power: 34 },
    { level: 10, requiredLevel: 32, spCost: 8300, mpCost: 19, power: 35 },
    { level: 11, requiredLevel: 36, spCost: 13000, mpCost: 20, power: 38 },
    { level: 12, requiredLevel: 36, spCost: 13000, mpCost: 20, power: 39 },
    { level: 13, requiredLevel: 36, spCost: 13000, mpCost: 22, power: 40 },
  ],
};

