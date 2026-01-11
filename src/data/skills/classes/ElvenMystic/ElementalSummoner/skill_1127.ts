import { SkillDefinition } from "../../../types";

// Servitor Heal - продолжение уровней для Elemental Summoner (lv.13-45)
export const skill_1127: SkillDefinition = {
  id: 1127,
  code: "EW_1127",
  name: "Servitor Heal",
  description: "Recovers servitor's HP. Power 404-936 (зависит от уровня).\n\nВосстанавливает HP сервитора. Сила: 404-936 (зависит от уровня). Кастуется на сервитора, действует в пределах дальности 600. Каст: 4 сек. Перезарядка: 10 сек.",
  icon: "/skills/skill1127.gif",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 10,
  levels: [
    // Level 40
    { level: 13, requiredLevel: 40, spCost: 10000, mpCost: 58, power: 404 },
    { level: 14, requiredLevel: 40, spCost: 10000, mpCost: 60, power: 419 },
    { level: 15, requiredLevel: 40, spCost: 10000, mpCost: 62, power: 434 },
    // Level 44
    { level: 16, requiredLevel: 44, spCost: 15000, mpCost: 64, power: 465 },
    { level: 17, requiredLevel: 44, spCost: 15000, mpCost: 65, power: 481 },
    { level: 18, requiredLevel: 44, spCost: 15000, mpCost: 68, power: 496 },
    // Level 48
    { level: 19, requiredLevel: 48, spCost: 22000, mpCost: 72, power: 528 },
    { level: 20, requiredLevel: 48, spCost: 22000, mpCost: 74, power: 544 },
    { level: 21, requiredLevel: 48, spCost: 22000, mpCost: 77, power: 561 },
    // Level 52
    { level: 22, requiredLevel: 52, spCost: 35000, mpCost: 80, power: 593 },
    { level: 23, requiredLevel: 52, spCost: 35000, mpCost: 80, power: 609 },
    { level: 24, requiredLevel: 52, spCost: 35000, mpCost: 83, power: 626 },
    // Level 56
    { level: 25, requiredLevel: 56, spCost: 37000, mpCost: 87, power: 658 },
    { level: 26, requiredLevel: 56, spCost: 37000, mpCost: 89, power: 674 },
    { level: 27, requiredLevel: 56, spCost: 37000, mpCost: 90, power: 690 },
    // Level 58
    { level: 28, requiredLevel: 58, spCost: 92000, mpCost: 93, power: 706 },
    { level: 29, requiredLevel: 58, spCost: 92000, mpCost: 95, power: 722 },
    // Level 60
    { level: 30, requiredLevel: 60, spCost: 110000, mpCost: 97, power: 737 },
    { level: 31, requiredLevel: 60, spCost: 110000, mpCost: 98, power: 753 },
    // Level 62
    { level: 32, requiredLevel: 62, spCost: 150000, mpCost: 98, power: 768 },
    { level: 33, requiredLevel: 62, spCost: 150000, mpCost: 100, power: 783 },
    // Level 64
    { level: 34, requiredLevel: 64, spCost: 200000, mpCost: 102, power: 798 },
    { level: 35, requiredLevel: 64, spCost: 200000, mpCost: 104, power: 812 },
    // Level 66
    { level: 36, requiredLevel: 66, spCost: 270000, mpCost: 105, power: 826 },
    { level: 37, requiredLevel: 66, spCost: 270000, mpCost: 108, power: 840 },
    // Level 68
    { level: 38, requiredLevel: 68, spCost: 320000, mpCost: 109, power: 854 },
    { level: 39, requiredLevel: 68, spCost: 320000, mpCost: 112, power: 867 },
    // Level 70
    { level: 40, requiredLevel: 70, spCost: 340000, mpCost: 113, power: 879 },
    { level: 41, requiredLevel: 70, spCost: 340000, mpCost: 114, power: 892 },
    // Level 72
    { level: 42, requiredLevel: 72, spCost: 630000, mpCost: 115, power: 904 },
    { level: 43, requiredLevel: 72, spCost: 630000, mpCost: 117, power: 915 },
    // Level 74
    { level: 44, requiredLevel: 74, spCost: 820000, mpCost: 119, power: 926 },
    { level: 45, requiredLevel: 74, spCost: 820000, mpCost: 120, power: 936 },
  ],
};

