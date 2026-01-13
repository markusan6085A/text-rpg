import { SkillDefinition } from "../../../types";

export const Skill_0100: SkillDefinition = {
  id: 100,
  code: "OR_0100",
  name: "Stun Attack",
  description: "A stunning blow that inflicts great pain. Target is dazed. The target cannot be stunned, shocked or dazed again while this is in effect. Usable when a blunt weapon is equipped. Over-hit possible. Power 30.\n\nОглушающий удар, наносящий большой урон. Цель оглушена. Требуется дубина. Возможен оверхит. Сила 30.",
  icon: "/skills/skill0100.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.08,
  cooldown: 13,
  effects: [
    { stat: "stunResist", mode: "flat", duration: 9, chance: 50 },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1100, mpCost: 20, power: 30 },
    { level: 2, requiredLevel: 20, spCost: 1100, mpCost: 21, power: 33 },
    { level: 3, requiredLevel: 20, spCost: 1100, mpCost: 21, power: 35 },
    { level: 4, requiredLevel: 24, spCost: 1800, mpCost: 22, power: 41 },
    { level: 5, requiredLevel: 24, spCost: 1800, mpCost: 23, power: 44 },
    { level: 6, requiredLevel: 24, spCost: 1800, mpCost: 23, power: 48 },
    { level: 7, requiredLevel: 28, spCost: 3600, mpCost: 25, power: 55 },
    { level: 8, requiredLevel: 28, spCost: 3600, mpCost: 26, power: 59 },
    { level: 9, requiredLevel: 28, spCost: 3600, mpCost: 27, power: 64 },
    { level: 10, requiredLevel: 32, spCost: 5600, mpCost: 29, power: 73 },
    { level: 11, requiredLevel: 32, spCost: 5600, mpCost: 29, power: 79 },
    { level: 12, requiredLevel: 32, spCost: 5600, mpCost: 30, power: 84 },
    { level: 13, requiredLevel: 36, spCost: 8600, mpCost: 32, power: 96 },
    { level: 14, requiredLevel: 36, spCost: 8600, mpCost: 33, power: 102 },
    { level: 15, requiredLevel: 36, spCost: 8600, mpCost: 34, power: 109 },
  ],
};

