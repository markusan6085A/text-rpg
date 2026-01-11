import { SkillDefinition } from "../../../types";

// Unlock - opens doors and chests
export const skill_0027: SkillDefinition = {
  id: 27,
  code: "ES_0027",
  name: "Unlock",
  description: "Opens level 1 doors with a chance for success. Requires Keys of a Thief. Also opens chests.\n\nОткрывает двери 1 уровня с определенной вероятностью. Требует Ключи вора. Также открывает сундуки.",
  icon: "/skills/skill0027.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 2.5,
  cooldown: 120,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2800, mpCost: 19, power: 30 }, // 30% chance, 2 keys
    { level: 2, requiredLevel: 24, spCost: 5000, mpCost: 22, power: 50 }, // 50% chance, 2 keys
    { level: 3, requiredLevel: 28, spCost: 9200, mpCost: 25, power: 75 }, // 75% chance, 3 keys
    { level: 4, requiredLevel: 32, spCost: 15000, mpCost: 28, power: 100 }, // 100% lv1, 5% lv2, 3 keys
    { level: 5, requiredLevel: 36, spCost: 26000, mpCost: 31, power: 100 }, // 100% lv1, 30% lv2, 4 keys
  ],
};

