import { SkillDefinition } from "../../../types";

// Mass Summon Aqua Cubic - Summons Aqua Cubic for party members. Aqua Cubic uses magic that damages a targeted enemy over time.
export const skill_1329: SkillDefinition = {
  id: 1329,
  code: "ES_1329",
  name: "Mass Summon Aqua Cubic",
  description: "Summons Aqua Cubic for party members. Aqua Cubic uses magic that damages a targeted enemy over time. Requires 8 Crystals: D-Grade.\n\nПризыв Mass Summon Aqua Cubic, применяется на себя, действует на партию в пределах 1000 дальности действия:\n- Призывает кубик, наносящий урон, 1 уровень.\n- Требует 8 шт. ? Crystal: D-Grade.",
  icon: "/skills/skill1329.gif",
  category: "special",
  powerType: "none",
  target: "party",
  scope: "party",
  castTime: 6,
  cooldown: 20,
  levels: [
    { level: 1, requiredLevel: 40, spCost: 32000, mpCost: 139, power: 0 },
    { level: 2, requiredLevel: 44, spCost: 44000, mpCost: 154, power: 0 },
    { level: 3, requiredLevel: 48, spCost: 67000, mpCost: 172, power: 0 },
    { level: 4, requiredLevel: 52, spCost: 100000, mpCost: 188, power: 0 },
    { level: 5, requiredLevel: 56, spCost: 110000, mpCost: 204, power: 0 },
    { level: 6, requiredLevel: 62, spCost: 310000, mpCost: 229, power: 0 },
    { level: 7, requiredLevel: 66, spCost: 540000, mpCost: 244, power: 0 },
    { level: 8, requiredLevel: 70, spCost: 670000, mpCost: 259, power: 0 },
    { level: 9, requiredLevel: 74, spCost: 1600000, mpCost: 272, power: 0 },
  ],
};

