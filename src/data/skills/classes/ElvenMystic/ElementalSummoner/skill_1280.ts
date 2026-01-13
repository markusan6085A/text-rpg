import { SkillDefinition } from "../../../types";

// Summon Aqua Cubic - Summons Aqua Cubic. Aqua Cubic uses magic that damages a targeted enemy over time.
export const skill_1280: SkillDefinition = {
  id: 1280,
  code: "ES_1280",
  name: "Summon Aqua Cubic",
  description: "Summons Aqua Cubic. Aqua Cubic uses magic that damages a targeted enemy over time. Requires 2 Crystals: D-Grade.\n\nПризыв Aqua Cubic, применяется на себя:\n- Призывает кубик, наносящий урон, 1 уровень.\n- Требует 2 шт. ? Crystal: D-Grade.",
  icon: "/skills/skill1280.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 6,
  cooldown: 20,
  levels: [
    { level: 1, requiredLevel: 40, spCost: 32000, mpCost: 35, power: 0 },
    { level: 2, requiredLevel: 44, spCost: 44000, mpCost: 39, power: 0 },
    { level: 3, requiredLevel: 48, spCost: 67000, mpCost: 44, power: 0 },
    { level: 4, requiredLevel: 52, spCost: 100000, mpCost: 48, power: 0 },
    { level: 5, requiredLevel: 56, spCost: 110000, mpCost: 52, power: 0 },
    { level: 6, requiredLevel: 62, spCost: 310000, mpCost: 58, power: 0 },
    { level: 7, requiredLevel: 66, spCost: 540000, mpCost: 62, power: 0 },
    { level: 8, requiredLevel: 70, spCost: 670000, mpCost: 65, power: 0 },
    { level: 9, requiredLevel: 74, spCost: 1600000, mpCost: 69, power: 0 },
  ],
};

