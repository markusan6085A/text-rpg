import { SkillDefinition } from "../../../types";

export const Skill_0120: SkillDefinition = {
  id: 120,
  code: "OM_0120",
  name: "Stunning Fist",
  description: "A stunning blow that inflicts great pain. Target is dazed. The target cannot be stunned, shocked or dazed again while this is in effect. Usable when a fist weapon is equipped. Over-hit possible.\n\nОглушающий удар, наносящий сильную боль. Цель оглушена. Цель не может быть оглушена, шокирована или ошеломлена снова, пока действует этот эффект. Используется при экипировке оружия для рукопашного боя. Возможен оверхит.",
  icon: "/skills/skill0120.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.604,
  cooldown: 13,
  effects: [
    { stat: "stunResist", mode: "flat", chance: 50, duration: 9 },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2600, mpCost: 22, power: 38 },
    { level: 2, requiredLevel: 20, spCost: 2600, mpCost: 22, power: 41 },
    { level: 3, requiredLevel: 20, spCost: 2600, mpCost: 22, power: 44 },
    { level: 4, requiredLevel: 24, spCost: 3300, mpCost: 23, power: 51 },
    { level: 5, requiredLevel: 24, spCost: 3300, mpCost: 24, power: 55 },
    { level: 6, requiredLevel: 24, spCost: 3300, mpCost: 25, power: 60 },
    { level: 7, requiredLevel: 28, spCost: 5700, mpCost: 27, power: 69 },
    { level: 8, requiredLevel: 28, spCost: 5700, mpCost: 29, power: 74 },
    { level: 9, requiredLevel: 28, spCost: 5700, mpCost: 30, power: 80 },
    { level: 10, requiredLevel: 32, spCost: 9500, mpCost: 31, power: 92 },
    { level: 11, requiredLevel: 32, spCost: 9500, mpCost: 31, power: 98 },
    { level: 12, requiredLevel: 32, spCost: 9500, mpCost: 33, power: 105 },
    { level: 13, requiredLevel: 36, spCost: 13000, mpCost: 35, power: 120 },
    { level: 14, requiredLevel: 36, spCost: 13000, mpCost: 36, power: 128 },
    { level: 15, requiredLevel: 36, spCost: 13000, mpCost: 37, power: 136 },
  ],
};

