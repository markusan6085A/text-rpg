import { SkillDefinition } from "../../../types";

// Greater Heal - Instantly restores lost HP and increases HP regeneration
// З XML: levels="33", power: 204-472
// Для Elven Elder: рівні 1-29 (requiredLevel: 48-74)
export const skill_1217: SkillDefinition = {
  id: 1217,
  code: "EE_1217",
  name: "Greater Heal",
  description: "Restores HP. Power 371.\n\nВосстанавливает HP. Сила: 371-817 (зависит от уровня). Каст: 5 сек. Перезарядка: 10 сек.",
  icon: "/skills/skill1217.gif",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 5,
  cooldown: 10,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 48, spCost: 22000, mpCost: 58, power: 371 },
    { level: 2, requiredLevel: 48, spCost: 22000, mpCost: 60, power: 384 },
    { level: 3, requiredLevel: 48, spCost: 22000, mpCost: 62, power: 398 },
    { level: 4, requiredLevel: 52, spCost: 33000, mpCost: 64, power: 426 },
    { level: 5, requiredLevel: 52, spCost: 33000, mpCost: 65, power: 441 },
    { level: 6, requiredLevel: 52, spCost: 33000, mpCost: 68, power: 455 },
    { level: 7, requiredLevel: 56, spCost: 35000, mpCost: 72, power: 484 },
    { level: 8, requiredLevel: 56, spCost: 35000, mpCost: 74, power: 499 },
    { level: 9, requiredLevel: 56, spCost: 35000, mpCost: 77, power: 514 },
    { level: 10, requiredLevel: 58, spCost: 52000, mpCost: 80, power: 544 },
    { level: 11, requiredLevel: 58, spCost: 52000, mpCost: 80, power: 559 },
    { level: 12, requiredLevel: 58, spCost: 52000, mpCost: 83, power: 574 },
    { level: 13, requiredLevel: 60, spCost: 71000, mpCost: 87, power: 603 },
    { level: 14, requiredLevel: 60, spCost: 71000, mpCost: 89, power: 618 },
    { level: 15, requiredLevel: 60, spCost: 71000, mpCost: 90, power: 633 },
    { level: 16, requiredLevel: 62, spCost: 150000, mpCost: 93, power: 647 },
    { level: 17, requiredLevel: 62, spCost: 150000, mpCost: 95, power: 662 },
    { level: 18, requiredLevel: 64, spCost: 170000, mpCost: 97, power: 676 },
    { level: 19, requiredLevel: 64, spCost: 170000, mpCost: 98, power: 690 },
    { level: 20, requiredLevel: 66, spCost: 250000, mpCost: 98, power: 704 },
    { level: 21, requiredLevel: 66, spCost: 250000, mpCost: 100, power: 718 },
    { level: 22, requiredLevel: 68, spCost: 300000, mpCost: 102, power: 731 },
    { level: 23, requiredLevel: 68, spCost: 300000, mpCost: 104, power: 745 },
    { level: 24, requiredLevel: 70, spCost: 360000, mpCost: 105, power: 758 },
    { level: 25, requiredLevel: 70, spCost: 360000, mpCost: 108, power: 770 },
    { level: 26, requiredLevel: 72, spCost: 540000, mpCost: 109, power: 783 },
    { level: 27, requiredLevel: 72, spCost: 540000, mpCost: 112, power: 795 },
    { level: 28, requiredLevel: 74, spCost: 820000, mpCost: 113, power: 806 },
    { level: 29, requiredLevel: 74, spCost: 820000, mpCost: 114, power: 817 },
  ],
};













