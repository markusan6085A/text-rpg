import { SkillDefinition } from "../../../types";

// Earthquake - area damage skill with spear
// XML: mpConsume: 87, hpConsume: 340, power: 4040, hitTime: 1800, reuseDelay: 30000, skillRadius: 150
export const skill_0347: SkillDefinition = {
  id: 347,
  code: "MA_0347",
  name: "Earthquake",
  description: "By brandishing a spear, strikes nearby enemies with a powerful force and cancels the target status. Critical and over-hit are possible. Available when one is equipped with a spear type weapon. Power 4040.\n\nРазмахивая копьем, наносит мощный удар по ближайшим врагам в радиусе 150 и отменяет статус цели. Возможны критический удар и оверхит. Доступен при экипировке оружия типа копье.",
  icon: "/skills/skill0347.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "area",
  scope: "area",
  castTime: 1.8,
  cooldown: 30,
  hpCost: 340,
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 87, power: 4040 },
  ],
};

