import { SkillDefinition } from "../../../types";

// Stun Attack - 15 levels
// XML: power: 30 33 35 41 44 48 55 59 64 73 79 84 96 102 109
// mpConsume: 20 21 21 22 23 23 25 26 27 29 29 30 32 33 34
export const skill_0100: SkillDefinition = {
  id: 100,
  code: "SC_0100",
  name: "Stun Attack",
  description: "A stunning blow that inflicts great pain. Target is dazed. The target cannot be stunned, shocked or dazed again while this is in effect. Usable when a blunt weapon is equipped. Over-hit possible.\n\nОглушающий удар, наносящий сильную боль. Цель оглушена. Цель не может быть оглушена, шокирована или ошеломлена снова, пока действует эффект. Используется при экипировке тупого оружия. Возможен оверхит.",
  icon: "/skills/0100.jpg",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.08,
  cooldown: 13,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1400, mpCost: 22, power: 30 },
    { level: 2, requiredLevel: 20, spCost: 1400, mpCost: 22, power: 33 },
    { level: 3, requiredLevel: 20, spCost: 1400, mpCost: 22, power: 35 },
    { level: 4, requiredLevel: 24, spCost: 2600, mpCost: 23, power: 41 },
    { level: 5, requiredLevel: 24, spCost: 2600, mpCost: 24, power: 44 },
    { level: 6, requiredLevel: 24, spCost: 2600, mpCost: 25, power: 48 },
    { level: 7, requiredLevel: 28, spCost: 4400, mpCost: 27, power: 55 },
    { level: 8, requiredLevel: 28, spCost: 4400, mpCost: 29, power: 59 },
    { level: 9, requiredLevel: 28, spCost: 4400, mpCost: 30, power: 64 },
    { level: 10, requiredLevel: 32, spCost: 8300, mpCost: 31, power: 73 },
    { level: 11, requiredLevel: 32, spCost: 8300, mpCost: 31, power: 79 },
    { level: 12, requiredLevel: 32, spCost: 8300, mpCost: 33, power: 84 },
    { level: 13, requiredLevel: 36, spCost: 11000, mpCost: 35, power: 96 },
    { level: 14, requiredLevel: 36, spCost: 11000, mpCost: 36, power: 102 },
    { level: 15, requiredLevel: 36, spCost: 11000, mpCost: 37, power: 109 },
  ],
};

