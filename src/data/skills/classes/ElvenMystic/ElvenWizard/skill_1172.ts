import { SkillDefinition } from "../../../types";

// Aura Burn - a short range magical attack
export const skill_1172: SkillDefinition = {
  id: 1172,
  code: "EW_1172",
  name: "Aura Burn",
  description: "A short range magical attack. Power 19.\n\nКороткодистанционная магическая атака. Сила: 19-36 (зависит от уровня). Кастуется на врагов, действует в пределах дальности 150. Каст: 1.5 сек. Перезарядка: 2.5 сек.",
  icon: "/skills/skill1172.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 2.5,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1600, mpCost: 18, power: 19 },
    { level: 2, requiredLevel: 20, spCost: 1600, mpCost: 20, power: 21 },
    { level: 3, requiredLevel: 25, spCost: 3100, mpCost: 22, power: 24 },
    { level: 4, requiredLevel: 25, spCost: 3100, mpCost: 23, power: 25 },
    { level: 5, requiredLevel: 30, spCost: 5800, mpCost: 25, power: 28 },
    { level: 6, requiredLevel: 30, spCost: 5800, mpCost: 27, power: 30 },
    { level: 7, requiredLevel: 35, spCost: 10000, mpCost: 29, power: 33 },
    { level: 8, requiredLevel: 35, spCost: 10000, mpCost: 30, power: 36 },
  ],
};

