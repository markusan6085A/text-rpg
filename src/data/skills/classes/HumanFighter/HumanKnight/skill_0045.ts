import { SkillDefinition } from "../../../types";

// Divine Heal для HumanKnight (рівні 1-9)
export const skill_0045: SkillDefinition = {
  id: 45,
  code: "HK_0045",
  name: "Divine Heal",
  description: "Recover HP.\n\nВосстанавливает HP. Восстанавливает 143-219 HP (зависит от уровня). Каст: 4 сек. Перезарядка: 10 сек.",
  category: "heal",
  powerType: "damage",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 10,
  icon: "/skills/skill0045.gif",
  levels: [
    { level: 1, requiredLevel: 28, spCost: 4000, mpCost: 75, power: 143 },
    { level: 2, requiredLevel: 28, spCost: 4000, mpCost: 79, power: 150 },
    { level: 3, requiredLevel: 28, spCost: 4000, mpCost: 83, power: 157 },
    { level: 4, requiredLevel: 32, spCost: 8300, mpCost: 88, power: 171 },
    { level: 5, requiredLevel: 32, spCost: 8300, mpCost: 88, power: 179 },
    { level: 6, requiredLevel: 32, spCost: 8300, mpCost: 92, power: 187 },
    { level: 7, requiredLevel: 36, spCost: 13000, mpCost: 99, power: 203 },
    { level: 8, requiredLevel: 36, spCost: 13000, mpCost: 103, power: 211 },
    { level: 9, requiredLevel: 36, spCost: 13000, mpCost: 107, power: 219 },
  ],
};

