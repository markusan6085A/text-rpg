import { SkillDefinition } from "../../../types";

export const Skill_0347: SkillDefinition = {
  id: 347,
  code: "OR_0347",
  name: "Earthquake",
  description: "By brandishing a spear, strikes nearby enemies with a powerful force and cancels the target status. Critical and over-hit are possible. Available when one is equipped with a spear type weapon.\n\nРазмахивая копьем, наносит мощный удар по ближайшим врагам и снимает статус цели. Возможны критический удар и оверхит. Доступно при экипировке копья.",
  icon: "/skills/skill0347.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "area",
  castTime: 1.8,
  cooldown: 30,
  hpCost: 340,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 87, power: 4040 },
  ],
};

