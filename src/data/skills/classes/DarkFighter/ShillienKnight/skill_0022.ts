import { SkillDefinition } from "../../../types";

// Summon Vampiric Cubic - summons Vampiric Cubic that absorbs enemy HP and regenerates master's HP
export const skill_0022: SkillDefinition = {
  id: 22,
  code: "SK_0022",
  name: "Summon Vampiric Cubic",
  description: "Summons a Vampiric Cubic. A Vampiric Cubic uses magic that absorbs the targeted enemy's HP and with it regenerates its master's HP. Requires Crystals: D-Grade.\n\nПризывает Вампирический Кубик. Вампирический Кубик использует магию, которая поглощает HP цели и восстанавливает HP хозяина. Требуются кристаллы: D-Grade.",
  icon: "/skills/skill0022.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 6,
  cooldown: 20,
  duration: 0, // Permanent until dismissed
  levels: [
    { level: 1, requiredLevel: 46, spCost: 32000, mpCost: 38, power: 0 },
    { level: 2, requiredLevel: 55, spCost: 130000, mpCost: 50, power: 0 },
    { level: 3, requiredLevel: 58, spCost: 130000, mpCost: 50, power: 0 },
    { level: 4, requiredLevel: 62, spCost: 180000, mpCost: 55, power: 0 },
    { level: 5, requiredLevel: 66, spCost: 240000, mpCost: 58, power: 0 },
    { level: 6, requiredLevel: 70, spCost: 410000, mpCost: 62, power: 0 },
    { level: 7, requiredLevel: 74, spCost: 880000, mpCost: 67, power: 0 },
  ],
};

