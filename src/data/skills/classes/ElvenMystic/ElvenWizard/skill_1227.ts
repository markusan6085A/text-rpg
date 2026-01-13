import { SkillDefinition } from "../../../types";

// Summon Unicorn Mirage - summons a Unicorn Mirage
export const skill_1227: SkillDefinition = {
  id: 1227,
  code: "EW_1227",
  name: "Summon Unicorn Mirage",
  description: "Summons a Unicorn Mirage. The unicorn will use attack magic to assist one during combat. Requires 1 Crystal: D-Grade. Consumes 90% of acquired Exp.\n\nПризывает Unicorn Mirage. Забирает 90% опыта, получаемого в бою. Требует 1 шт. Crystal: D-Grade. Требует кристаллы для призыва. Каст: 15 сек. Перезарядка: 21600 сек (6 часов).",
  icon: "/skills/skill1227.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 15,
  cooldown: 21600, // 6 hours
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 39, power: 0 },
    { level: 2, requiredLevel: 25, spCost: 6100, mpCost: 44, power: 0 },
    { level: 3, requiredLevel: 30, spCost: 12000, mpCost: 53, power: 0 },
    { level: 4, requiredLevel: 35, spCost: 21000, mpCost: 60, power: 0 },
  ],
};

