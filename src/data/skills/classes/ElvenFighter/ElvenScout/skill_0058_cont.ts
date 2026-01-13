import { SkillDefinition } from "../../../types";

// Elemental Heal - continuation from common (lv.4-18)
export const skill_0058_cont: SkillDefinition = {
  id: 58,
  code: "ES_0058",
  name: "Elemental Heal",
  description: "Regenerates one's HP.\n\nВосстанавливает HP. Сила 95-219 (зависит от уровня).",
  icon: "/skills/skill0058.gif",
  category: "heal",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 5,
  cooldown: 10,
  levels: [
    { level: 4, requiredLevel: 20, spCost: 1200, mpCost: 53, power: 95 },
    { level: 5, requiredLevel: 20, spCost: 1200, mpCost: 57, power: 100 },
    { level: 6, requiredLevel: 20, spCost: 1200, mpCost: 59, power: 106 },
    { level: 7, requiredLevel: 24, spCost: 1700, mpCost: 62, power: 118 },
    { level: 8, requiredLevel: 24, spCost: 1700, mpCost: 65, power: 124 },
    { level: 9, requiredLevel: 24, spCost: 1700, mpCost: 69, power: 130 },
    { level: 10, requiredLevel: 28, spCost: 3100, mpCost: 75, power: 143 },
    { level: 11, requiredLevel: 28, spCost: 3100, mpCost: 79, power: 150 },
    { level: 12, requiredLevel: 28, spCost: 3100, mpCost: 83, power: 157 },
    { level: 13, requiredLevel: 32, spCost: 5100, mpCost: 88, power: 171 },
    { level: 14, requiredLevel: 32, spCost: 5100, mpCost: 88, power: 179 },
    { level: 15, requiredLevel: 32, spCost: 5100, mpCost: 92, power: 187 },
    { level: 16, requiredLevel: 36, spCost: 8600, mpCost: 99, power: 203 },
    { level: 17, requiredLevel: 36, spCost: 8600, mpCost: 103, power: 211 },
    { level: 18, requiredLevel: 36, spCost: 8600, mpCost: 107, power: 219 },
  ],
};

