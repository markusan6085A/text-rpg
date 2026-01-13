import { SkillDefinition } from "../../../types";

// Vitalize - Recovers HP, cures poison, and stops bleeding
// З XML: levels="27", power: 440-780
// Для Elven Elder: рівні 1-27 (requiredLevel: 48-74)
export const skill_1020: SkillDefinition = {
  id: 1020,
  code: "EE_1020",
  name: "Vitalize",
  description: "Recovers HP, cures poison, and stops bleeding with Effect 3 or less. Power 440.\n\nВосстанавливает HP, лечит отравление и останавливает кровотечение с эффектом 3 или меньше. Сила: 440-780 (зависит от уровня). Каст: 5 сек. Перезарядка: 10 сек.",
  icon: "/skills/skill1020.gif",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 5,
  cooldown: 10,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 48, spCost: 22000, mpCost: 87, power: 440 },
    { level: 2, requiredLevel: 48, spCost: 22000, mpCost: 89, power: 454 },
    { level: 3, requiredLevel: 48, spCost: 22000, mpCost: 92, power: 467 },
    { level: 4, requiredLevel: 52, spCost: 33000, mpCost: 97, power: 494 },
    { level: 5, requiredLevel: 52, spCost: 33000, mpCost: 97, power: 508 },
    { level: 6, requiredLevel: 52, spCost: 33000, mpCost: 99, power: 521 },
    { level: 7, requiredLevel: 56, spCost: 35000, mpCost: 104, power: 548 },
    { level: 8, requiredLevel: 56, spCost: 35000, mpCost: 107, power: 562 },
    { level: 9, requiredLevel: 56, spCost: 35000, mpCost: 109, power: 575 },
    { level: 10, requiredLevel: 58, spCost: 79000, mpCost: 112, power: 588 },
    { level: 11, requiredLevel: 58, spCost: 79000, mpCost: 114, power: 602 },
    { level: 12, requiredLevel: 60, spCost: 110000, mpCost: 117, power: 615 },
    { level: 13, requiredLevel: 60, spCost: 110000, mpCost: 118, power: 627 },
    { level: 14, requiredLevel: 62, spCost: 150000, mpCost: 118, power: 640 },
    { level: 15, requiredLevel: 62, spCost: 150000, mpCost: 120, power: 653 },
    { level: 16, requiredLevel: 64, spCost: 170000, mpCost: 123, power: 665 },
    { level: 17, requiredLevel: 64, spCost: 170000, mpCost: 124, power: 677 },
    { level: 18, requiredLevel: 66, spCost: 250000, mpCost: 127, power: 689 },
    { level: 19, requiredLevel: 66, spCost: 250000, mpCost: 129, power: 700 },
    { level: 20, requiredLevel: 68, spCost: 300000, mpCost: 132, power: 711 },
    { level: 21, requiredLevel: 68, spCost: 300000, mpCost: 133, power: 722 },
    { level: 22, requiredLevel: 70, spCost: 360000, mpCost: 135, power: 733 },
    { level: 23, requiredLevel: 70, spCost: 360000, mpCost: 137, power: 743 },
    { level: 24, requiredLevel: 72, spCost: 540000, mpCost: 139, power: 753 },
    { level: 25, requiredLevel: 72, spCost: 540000, mpCost: 140, power: 763 },
    { level: 26, requiredLevel: 74, spCost: 820000, mpCost: 142, power: 772 },
    { level: 27, requiredLevel: 74, spCost: 820000, mpCost: 144, power: 780 },
  ],
};













