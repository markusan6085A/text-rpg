import { SkillDefinition } from "../../../types";

// Summon Phantom Cubic - summons Phantom Cubic that decreases P.Atk, P.Def, and Atk.Speed
export const skill_0033: SkillDefinition = {
  id: 33,
  code: "SK_0033",
  name: "Summon Phantom Cubic",
  description: "Summons Phantom Cubic. Phantom Cubic uses magic that decreases P.Atk, P.Def, and Atk.Speed of a targeted enemy. Requires Crystals: D-Grade.\n\nПризывает Фантомный Кубик. Фантомный Кубик использует магию, которая снижает физическую атаку, физическую защиту и скорость атаки цели. Требуются кристаллы: D-Grade.",
  icon: "/skills/skill0033.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 6,
  cooldown: 20,
  duration: 0, // Permanent until dismissed
  levels: [
    { level: 1, requiredLevel: 40, spCost: 31000, mpCost: 35, power: 0 },
    { level: 2, requiredLevel: 49, spCost: 40000, mpCost: 42, power: 0 },
    { level: 3, requiredLevel: 55, spCost: 94000, mpCost: 48, power: 0 },
    { level: 4, requiredLevel: 60, spCost: 140000, mpCost: 54, power: 0 },
    { level: 5, requiredLevel: 64, spCost: 240000, mpCost: 58, power: 0 },
    { level: 6, requiredLevel: 68, spCost: 300000, mpCost: 62, power: 0 },
    { level: 7, requiredLevel: 70, spCost: 510000, mpCost: 65, power: 0 },
    { level: 8, requiredLevel: 74, spCost: 1400000, mpCost: 69, power: 0 },
  ],
};

