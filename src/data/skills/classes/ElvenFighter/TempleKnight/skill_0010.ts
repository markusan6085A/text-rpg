import { SkillDefinition } from "../../../types";

// Summon Storm Cubic - summons a storm cubic that inflicts damage to enemy
export const skill_0010: SkillDefinition = {
  id: 10,
  code: "TK_0010",
  name: "Summon Storm Cubic",
  description: "Summons a storm cubic. A storm cubic uses magic that inflicts damage to one's enemy. When summoning, 5 Crystals: D-Grade are consumed.\n\nПризывает кубик, наносящий урон, 1 уровень. Потребляет 5 шт. ? Crystal: D-Grade.",
  icon: "/skills/skill0010.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 6,
  cooldown: 20,
  duration: 0, // Permanent until dismissed
  levels: [
    { level: 1, requiredLevel: 40, spCost: 30000, mpCost: 35, power: 0 },
    { level: 2, requiredLevel: 46, spCost: 50000, mpCost: 42, power: 0 },
    { level: 3, requiredLevel: 52, spCost: 120000, mpCost: 48, power: 0 },
    { level: 4, requiredLevel: 58, spCost: 200000, mpCost: 54, power: 0 },
    { level: 5, requiredLevel: 62, spCost: 310000, mpCost: 58, power: 0 },
    { level: 6, requiredLevel: 66, spCost: 580000, mpCost: 62, power: 0 },
    { level: 7, requiredLevel: 70, spCost: 720000, mpCost: 65, power: 0 },
    { level: 8, requiredLevel: 74, spCost: 1900000, mpCost: 69, power: 0 },
  ],
};

