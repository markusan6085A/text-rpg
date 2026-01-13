import { SkillDefinition } from "../../../types";

// Unlock - continuation from Elven Scout (lv.6-14)
export const skill_0027_cont: SkillDefinition = {
  id: 27,
  code: "PW_0027",
  name: "Unlock",
  description: "Opens level 1 doors and level 2 doors at 100% probability and level 3 doors at various probabilities. Requires Keys of a Thief. Also opens chests.\n\nОткрывает двери 1 уровня с вероятностью 100%, 2 уровня с вероятностью 100%, 3 уровня с вероятностью 0%-100% (зависит от уровня). Требует Ключи вора (5-17 ключей). Также открывает сундуки.",
  icon: "/skills/skill0027.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 2.5,
  cooldown: 120,
  levels: [
    { level: 6, requiredLevel: 40, spCost: 28000, mpCost: 35, power: 0 }, // 100% lv1, 75% lv2, 0% lv3, 5 keys
    { level: 7, requiredLevel: 43, spCost: 35000, mpCost: 39, power: 0 }, // 100% lv1, 100% lv2, 5% lv3, 6 keys
    { level: 8, requiredLevel: 46, spCost: 43000, mpCost: 43, power: 0 }, // 100% lv1, 100% lv2, 30% lv3, 7 keys
    { level: 9, requiredLevel: 52, spCost: 120000, mpCost: 47, power: 0 }, // 100% lv1, 100% lv2, 75% lv3, 8 keys
    { level: 10, requiredLevel: 55, spCost: 160000, mpCost: 51, power: 0 }, // 100% lv1, 100% lv2, 100% lv3, 10 keys
    { level: 11, requiredLevel: 60, spCost: 260000, mpCost: 55, power: 0 }, // 100% lv1, 100% lv2, 100% lv3, 11 keys
    { level: 12, requiredLevel: 64, spCost: 480000, mpCost: 59, power: 0 }, // 100% lv1, 100% lv2, 100% lv3, 13 keys
    { level: 13, requiredLevel: 68, spCost: 650000, mpCost: 63, power: 0 }, // 100% lv1, 100% lv2, 100% lv3, 15 keys
    { level: 14, requiredLevel: 72, spCost: 1400000, mpCost: 67, power: 0 }, // 100% lv1, 100% lv2, 100% lv3, 17 keys
  ],
};

