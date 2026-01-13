import { SkillDefinition } from "../../../types";

// Summon Unicorn Boxer - summons a Unicorn Boxer, who supplies additional MP
// Elven Wizard version - must be distinguished from DarkMystic "Greater Empower"
export const skill_1226: SkillDefinition = {
  id: 1226,
  code: "EW_1226",
  name: "Summon Unicorn Boxer",
  description: "Summons a Unicorn Boxer, who supplies additional MP. Requires 3 Crystals: D-Grade. 30% of acquired Exp will be consumed.\n\nПризывает Unicorn Boxer. Забирает 30% опыта, получаемого в бою. Требует 3-4 шт. Crystal: D-Grade. Требует кристаллы для призыва. Каст: 15 сек. Перезарядка: 21600 сек (6 часов).",
  icon: "/skills/skill1226.gif",
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

