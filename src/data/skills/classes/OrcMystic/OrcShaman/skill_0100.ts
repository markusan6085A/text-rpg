import { SkillDefinition } from "../../../types";

// Stun Attack - physical attack skill that stuns the target
export const skill_0100: SkillDefinition = {
  id: 100,
  code: "OS_0100",
  name: "Stun Attack",
  description: "A stunning blow that inflicts great pain. Target is dazed. The target cannot be stunned, shocked or dazed again while this is in effect. Usable when a blunt weapon is equipped. Over-hit possible. Power 30.\n\nОглушающий удар, наносящий большой урон. Цель оглушена. Цель не может быть оглушена снова, пока действует эффект. Требуется дубина. Возможен оверхит.",
  icon: "/skills/skill0100.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.08,
  cooldown: 13,
  duration: 9,
  chance: 50,
  effects: [
    { stat: "stunResist", mode: "multiplier", multiplier: 0 }, // Effectively stuns target
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 960, mpCost: 22, power: 30 },
    { level: 2, requiredLevel: 20, spCost: 960, mpCost: 22, power: 33 },
    { level: 3, requiredLevel: 20, spCost: 960, mpCost: 22, power: 35 },
    { level: 4, requiredLevel: 25, spCost: 1900, mpCost: 23, power: 41 },
    { level: 5, requiredLevel: 25, spCost: 1900, mpCost: 24, power: 44 },
    { level: 6, requiredLevel: 25, spCost: 1900, mpCost: 25, power: 48 },
    { level: 7, requiredLevel: 30, spCost: 3500, mpCost: 27, power: 55 },
    { level: 8, requiredLevel: 30, spCost: 3500, mpCost: 29, power: 59 },
    { level: 9, requiredLevel: 30, spCost: 3500, mpCost: 30, power: 64 },
    { level: 10, requiredLevel: 35, spCost: 5900, mpCost: 31, power: 73 },
    { level: 11, requiredLevel: 35, spCost: 5900, mpCost: 31, power: 79 },
    { level: 12, requiredLevel: 35, spCost: 5900, mpCost: 33, power: 84 },
  ],
};

