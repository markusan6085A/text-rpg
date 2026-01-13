import { SkillDefinition } from "../../../types";

export const skill_0347: SkillDefinition = {
  id: 347,
  code: "DN_0347",
  name: "Earthquake",
  description: "By brandishing a spear, strikes nearby enemies with a powerful force and cancels the target status. Critical and over-hit are possible. Available when one is equipped with a spear type weapon.\n\nРазмахивая копьем, наносит мощный удар ближайшим врагам и снимает статус цели. Сила: 4040. Игнорирует защиту щитом. Возможны критический удар и оверхит. Требуется копье. Каст: 1.8 сек. Перезарядка: 30 сек.",
  category: "magic_attack",
  powerType: "flat",
  target: "enemy",
  scope: "area",
  icon: "/skills/skill0347.gif",
  castTime: 1.8,
  cooldown: 30,
  levels: [
    { level: 1, requiredLevel: 78, spCost: 21000000, mpCost: 87, power: 4040 },
  ],
};

