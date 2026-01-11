import { SkillDefinition } from "../../../types";

// Summon Life Cubic - Summons Life Cubic. Life Cubic uses magic that recovers master's HP.
export const skill_0067: SkillDefinition = {
  id: 67,
  code: "ES_0067",
  name: "Summon Life Cubic",
  description: "Summons Life Cubic. Life Cubic uses magic that recovers master's HP. Requires 6 Crystals: D-Grade.\n\nПризыв Life Cubic, применяется на себя:\n- Призывает кубик, лечащий HP, 1 уровень.\n- Требует 6 шт. ? Crystal: D-Grade.",
  icon: "/skills/skill0067.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 6,
  cooldown: 20,
  levels: [
    { level: 1, requiredLevel: 40, spCost: 32000, mpCost: 38, power: 0 },
    { level: 2, requiredLevel: 48, spCost: 67000, mpCost: 44, power: 0 },
    { level: 3, requiredLevel: 52, spCost: 100000, mpCost: 50, power: 0 },
    { level: 4, requiredLevel: 60, spCost: 210000, mpCost: 55, power: 0 },
    { level: 5, requiredLevel: 64, spCost: 400000, mpCost: 60, power: 0 },
    { level: 6, requiredLevel: 68, spCost: 640000, mpCost: 64, power: 0 },
    { level: 7, requiredLevel: 72, spCost: 1300000, mpCost: 67, power: 0 },
  ],
};

