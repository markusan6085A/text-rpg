import { SkillDefinition } from "../../../types";

export const skill_0121: SkillDefinition = {
  id: 121,
  code: "WL_0121",
  name: "Battle Roar",
  description: "Temporarily increases maximum HP and restores HP.\n\nВременно увеличивает максимальное HP и восстанавливает HP.",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 600,
  duration: 1200, // 20 хвилин
  icon: "/skills/skill0121.gif",
  effects: [{ stat: "maxHp", mode: "percent" }],
  levels: [
    { level: 2, requiredLevel: 40, spCost: 39000, mpCost: 18, power: 15 },
    { level: 3, requiredLevel: 49, spCost: 89000, mpCost: 22, power: 20 },
    { level: 4, requiredLevel: 58, spCost: 210000, mpCost: 27, power: 25 },
    { level: 5, requiredLevel: 64, spCost: 530000, mpCost: 30, power: 30 },
    { level: 6, requiredLevel: 70, spCost: 850000, mpCost: 33, power: 35 },
  ],
};

