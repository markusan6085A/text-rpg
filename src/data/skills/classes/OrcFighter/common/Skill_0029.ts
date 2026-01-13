import { SkillDefinition } from "../../../types";

export const Skill_0029: SkillDefinition = {
  id: 29,
  code: "OF_0029",
  name: "Iron Punch",
  description: "Strikes target with a fist of iron. Usable when a fist weapon is equipped. Power 29. Over-hit possible.\n\nНаносит урон силой 29. Возможен оверхит. Требуется кастет.",
  icon: "/skills/skill0029.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.604,
  cooldown: 15,
  levels: [
    { level: 1, requiredLevel: 5, spCost: 60, mpCost: 11, power: 29 },
    { level: 2, requiredLevel: 5, spCost: 60, mpCost: 12, power: 31 },
    { level: 3, requiredLevel: 5, spCost: 60, mpCost: 13, power: 34 },
    { level: 4, requiredLevel: 10, spCost: 460, mpCost: 15, power: 45 },
    { level: 5, requiredLevel: 10, spCost: 460, mpCost: 15, power: 49 },
    { level: 6, requiredLevel: 10, spCost: 460, mpCost: 16, power: 54 },
    { level: 7, requiredLevel: 15, spCost: 1300, mpCost: 20, power: 69 },
    { level: 8, requiredLevel: 15, spCost: 1300, mpCost: 21, power: 76 },
    { level: 9, requiredLevel: 15, spCost: 1300, mpCost: 22, power: 82 },
  ],
};

