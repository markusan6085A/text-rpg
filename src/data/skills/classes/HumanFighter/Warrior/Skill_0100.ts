import { SkillDefinition } from "../../../types";

export const Skill_0100: SkillDefinition = {
  id: 100,
  code: "WR_0100",
  name: "Stun Attack",
  description: "A stunning blow that inflicts great pain. Target is dazed. The target cannot be stunned, shocked or dazed again while this is in effect. Usable when a blunt weapon is equipped. Over-hit possible. Power 30.\n\nОглушающий удар, наносящий сильную боль. Цель оглушена. Цель не может быть оглушена, шокирована или ошеломлена снова, пока действует эффект. Используется при экипировке тупого оружия. Возможен оверхит. Сила 30.",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  cooldown: 3,
  icon: "/skills/0100.jpg",
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1200, mpCost: 19, power: 36 },
    { level: 2, requiredLevel: 20, spCost: 1200, mpCost: 19, power: 39 },
    { level: 3, requiredLevel: 20, spCost: 1200, mpCost: 20, power: 42 },
    { level: 4, requiredLevel: 24, spCost: 2100, mpCost: 21, power: 49 },
    { level: 5, requiredLevel: 24, spCost: 2100, mpCost: 21, power: 53 },
    { level: 6, requiredLevel: 24, spCost: 2100, mpCost: 22, power: 57 },
    { level: 7, requiredLevel: 28, spCost: 4000, mpCost: 24, power: 66 },
    { level: 8, requiredLevel: 28, spCost: 4000, mpCost: 25, power: 71 },
    { level: 9, requiredLevel: 28, spCost: 4000, mpCost: 26, power: 77 },
    { level: 10, requiredLevel: 32, spCost: 6100, mpCost: 27, power: 88 },
    { level: 11, requiredLevel: 32, spCost: 6100, mpCost: 28, power: 94 },
    { level: 12, requiredLevel: 32, spCost: 6100, mpCost: 29, power: 101 },
    { level: 13, requiredLevel: 36, spCost: 10000, mpCost: 31, power: 115 },
    { level: 14, requiredLevel: 36, spCost: 10000, mpCost: 32, power: 123 },
    { level: 15, requiredLevel: 36, spCost: 10000, mpCost: 33, power: 131 },
  ],
};

