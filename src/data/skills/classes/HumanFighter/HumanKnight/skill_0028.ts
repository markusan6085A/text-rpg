import { SkillDefinition } from "../../../types";

// Aggression для HumanKnight (рівні 1-12, включаючи Hate lv.2-3)
export const skill_0028: SkillDefinition = {
  id: 28,
  code: "HK_0028",
  name: "Aggression",
  description: "Provokes an opponent to attack.\n\nПровоцирует противника атаковать. Сила: 655-1021 (зависит от уровня). Каст: 1 сек. Перезарядка: 3 сек.",
  category: "special",
  powerType: "flat",
  target: "enemy",
  scope: "single",
  castTime: 1,
  cooldown: 3,
  icon: "/skills/skill0028.gif",
  levels: [
    { level: 1, requiredLevel: 24, spCost: 3300, mpCost: 20, power: 655 },
    { level: 2, requiredLevel: 24, spCost: 3300, mpCost: 21, power: 679 }, // Hate lv.2
    { level: 3, requiredLevel: 24, spCost: 3300, mpCost: 22, power: 703 }, // Hate lv.3
    { level: 4, requiredLevel: 28, spCost: 4000, mpCost: 23, power: 752 },
    { level: 5, requiredLevel: 28, spCost: 4000, mpCost: 24, power: 777 },
    { level: 6, requiredLevel: 28, spCost: 4000, mpCost: 25, power: 803 },
    { level: 7, requiredLevel: 32, spCost: 8300, mpCost: 26, power: 855 },
    { level: 8, requiredLevel: 32, spCost: 8300, mpCost: 27, power: 882 },
    { level: 9, requiredLevel: 32, spCost: 8300, mpCost: 28, power: 909 },
    { level: 10, requiredLevel: 36, spCost: 13000, mpCost: 29, power: 965 },
    { level: 11, requiredLevel: 36, spCost: 13000, mpCost: 30, power: 993 },
    { level: 12, requiredLevel: 36, spCost: 13000, mpCost: 31, power: 1021 },
  ],
};

