import { SkillDefinition } from "../../../types";

// Servitor Heal - recovers servitor's HP
export const skill_1127: SkillDefinition = {
  id: 1127,
  code: "EW_1127",
  name: "Servitor Heal",
  description: "Recovers servitor's HP. Power 145.\n\nВосстанавливает HP сервитора. Сила: 145-361 (зависит от уровня). Кастуется на сервитора, действует в пределах дальности 600. Каст: 4 сек. Перезарядка: 10 сек.",
  icon: "/skills/skill1127.gif",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 10,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1100, mpCost: 24, power: 145 },
    { level: 2, requiredLevel: 20, spCost: 1100, mpCost: 27, power: 162 },
    { level: 3, requiredLevel: 20, spCost: 1100, mpCost: 30, power: 181 },
    { level: 4, requiredLevel: 25, spCost: 2000, mpCost: 33, power: 212 },
    { level: 5, requiredLevel: 25, spCost: 2000, mpCost: 35, power: 222 },
    { level: 6, requiredLevel: 25, spCost: 2000, mpCost: 37, power: 234 },
    { level: 7, requiredLevel: 30, spCost: 3900, mpCost: 42, power: 269 },
    { level: 8, requiredLevel: 30, spCost: 3900, mpCost: 44, power: 281 },
    { level: 9, requiredLevel: 30, spCost: 3900, mpCost: 44, power: 294 },
    { level: 10, requiredLevel: 35, spCost: 6900, mpCost: 48, power: 333 },
    { level: 11, requiredLevel: 35, spCost: 6900, mpCost: 50, power: 347 },
    { level: 12, requiredLevel: 35, spCost: 6900, mpCost: 52, power: 361 },
  ],
};

