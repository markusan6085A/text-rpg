import { SkillDefinition } from "../../../types";

// Summon Unicorn Merrow - Summons Unicorn Merrow, a servitor.
export const skill_1277: SkillDefinition = {
  id: 1277,
  code: "ES_1277",
  name: "Summon Unicorn Merrow",
  description: "Summons Unicorn Merrow, a servitor. Requires 1 Crystal: C-Grade. Afterwards, 1 additional crystal will be consumed at a regular interval for 4 times. 10% of acquired Exp will be consumed.\n\nПризыв Summon Unicorn Merrow, применяется на себя:\n- Призывает Unicorn Merrow. Забирает получаемый опыт 10% опыта, получаемого в бою. Периодически потребляет 1 шт. ? Crystal: C-grade.\n- Требует 1 шт. ? Crystal: C-Grade.\n- Требует кристаллы для призыва.",
  icon: "/skills/skill1277.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 15,
  cooldown: 20,
  levels: [
    { level: 1, requiredLevel: 40, spCost: 32000, mpCost: 70, power: 0 },
    { level: 2, requiredLevel: 44, spCost: 44000, mpCost: 78, power: 0 },
    { level: 3, requiredLevel: 48, spCost: 67000, mpCost: 87, power: 0 },
    { level: 4, requiredLevel: 52, spCost: 100000, mpCost: 94, power: 0 },
    { level: 5, requiredLevel: 56, spCost: 110000, mpCost: 103, power: 0 },
    { level: 6, requiredLevel: 58, spCost: 180000, mpCost: 107, power: 0 },
    { level: 7, requiredLevel: 60, spCost: 210000, mpCost: 110, power: 0 },
    { level: 8, requiredLevel: 62, spCost: 310000, mpCost: 115, power: 0 },
    { level: 9, requiredLevel: 64, spCost: 400000, mpCost: 119, power: 0 },
    { level: 10, requiredLevel: 66, spCost: 540000, mpCost: 123, power: 0 },
    { level: 11, requiredLevel: 68, spCost: 640000, mpCost: 127, power: 0 },
    { level: 12, requiredLevel: 70, spCost: 670000, mpCost: 130, power: 0 },
    { level: 13, requiredLevel: 72, spCost: 1300000, mpCost: 133, power: 0 },
    { level: 14, requiredLevel: 74, spCost: 1600000, mpCost: 137, power: 0 },
  ],
};

