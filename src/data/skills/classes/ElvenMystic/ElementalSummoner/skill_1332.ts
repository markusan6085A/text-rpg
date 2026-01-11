import { SkillDefinition } from "../../../types";

// Summon Unicorn Seraphim - Summons a Unicorn Seraphim, a servitor.
// Gives master buff: +1% HP, +1% P.Atk, +1% M.Atk, -1% cooldown per level (at level 10: +10% HP, +10% P.Atk, +10% M.Atk, -10% cooldown)
export const skill_1332: SkillDefinition = {
  id: 1332,
  code: "ES_1332",
  name: "Summon Unicorn Seraphim",
  description: "Summons a Unicorn Seraphim, a servitor. Requires 1 Crystal: C-Grade. Afterwards, 1 additional crystal will be consumed at a regular interval for 4 times. 5% of acquired Exp will be consumed.\n\nПризывает Unicorn Seraphim. Забирает 5% опыта, получаемого в бою. Периодически потребляет 1 шт. Crystal: C-Grade.\n\nТребует 1 шт. Crystal: C-Grade для призыва.\n\nДает баф господарю (пока сервитор жив):\n- Увеличивает максимальный HP на 1% за каждый уровень скіла\n- Увеличивает физическую атаку на 1% за каждый уровень скіла\n- Увеличивает магическую атаку на 1% за каждый уровень скіла\n- Уменьшает cooldown всех скілов на 1% за каждый уровень скіла\n\nНа 10 уровне: +10% HP, +10% физ. атаки, +10% маг. атаки, -10% cooldown.",
  icon: "/skills/skill1332.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 15,
  cooldown: 20,
  effects: [
    // Effects are applied to master when summon is active
    // Values are per level: level 1 = 1%, level 10 = 10%
    { stat: "maxHp", mode: "percent" }, // +1% per level
    { stat: "pAtk", mode: "percent" }, // +1% per level
    { stat: "mAtk", mode: "percent" }, // +1% per level
    { stat: "cooldownReduction", mode: "percent" }, // -1% cooldown per level
  ],
  levels: [
    { level: 1, requiredLevel: 56, spCost: 110000, mpCost: 70, power: 1 },
    { level: 2, requiredLevel: 58, spCost: 180000, mpCost: 78, power: 2 },
    { level: 3, requiredLevel: 60, spCost: 210000, mpCost: 87, power: 3 },
    { level: 4, requiredLevel: 62, spCost: 310000, mpCost: 94, power: 4 },
    { level: 5, requiredLevel: 64, spCost: 400000, mpCost: 103, power: 5 },
    { level: 6, requiredLevel: 66, spCost: 540000, mpCost: 107, power: 6 },
    { level: 7, requiredLevel: 68, spCost: 640000, mpCost: 110, power: 7 },
    { level: 8, requiredLevel: 70, spCost: 670000, mpCost: 115, power: 8 },
    { level: 9, requiredLevel: 72, spCost: 1300000, mpCost: 119, power: 9 },
    { level: 10, requiredLevel: 74, spCost: 1600000, mpCost: 123, power: 10 },
  ],
};

