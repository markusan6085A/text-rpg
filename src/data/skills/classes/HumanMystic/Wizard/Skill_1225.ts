import { SkillDefinition } from "../../../types";

// Summon Mew the Cat
export const skill_1225: SkillDefinition = {
  id: 1225,
  code: "HM_1225",
  name: "Summon Mew the Cat",
  description: "Summons Mew the Cat for battle. D-grade crystal 90.\n\nПризывает кота Мью для боя. требует кристалл D-ранга 90. Каст: 1 сек. Перезарядка: 5сек.",
  icon: "/skills/skill1225.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1,
  cooldown: 5,
  duration: 1200, // 20 minutes
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2900, mpCost: 39, power: 5 }, // +5% до характеристик
    { level: 2, requiredLevel: 25, spCost: 5500, mpCost: 44, power: 10 }, // +10% до характеристик
    { level: 3, requiredLevel: 30, spCost: 11000, mpCost: 53, power: 15 }, // +15% до характеристик
    { level: 4, requiredLevel: 35, spCost: 18000, mpCost: 60, power: 20 }, // +20% до характеристик
  ],
};

