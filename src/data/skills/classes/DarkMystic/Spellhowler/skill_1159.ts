import { SkillDefinition } from "../../../types";

// Curse Death Link - 22 levels from XML
// Power: 68, 72, 75, 78, 80, 82, 84, 85, 87, 89, 90, 92, 94, 96, 97, 99, 100, 102, 104, 105, 107, 108
// mpConsume: 45, 48, 49, 52, 53, 54, 55, 55, 57, 58, 59, 60, 60, 62, 63, 64, 64, 65, 67, 67, 68, 69
// mpConsume_Init: 9, 10, 10, 10, 10, 10, 11, 11, 11, 11, 12, 12, 12, 12, 13, 13, 13, 13, 13, 13, 14, 14
const powerValues = [68, 72, 75, 78, 80, 82, 84, 85, 87, 89, 90, 92, 94, 96, 97, 99, 100, 102, 104, 105, 107, 108];
const mpConsumeInitValues = [9, 10, 10, 10, 10, 10, 11, 11, 11, 11, 12, 12, 12, 12, 13, 13, 13, 13, 13, 13, 14, 14];
const mpConsumeValues = [36, 38, 39, 42, 43, 44, 44, 44, 46, 47, 47, 48, 48, 50, 50, 51, 51, 52, 54, 54, 54, 55];
const magicLvlValues = [52, 52, 56, 56, 58, 58, 60, 60, 62, 62, 64, 64, 66, 66, 68, 68, 70, 70, 72, 72, 74, 74];

export const skill_1159: SkillDefinition = {
  id: 1159,
  code: "SP_1159",
  name: "Curse Death Link",
  description: "Transfers one's pain to the enemy. The lower one's HP, the greater its power. Power 68.\n\nАтака тьмой, кастуется на врагов, действует в пределах дальности 900: - Урон зависит от вашего текущего HP, чем меньше HP, тем больше урон. Базовая сила 68-108.",
  icon: "/skills/skill1159.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "dark",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  levels: powerValues.map((power, index) => ({
    level: index + 1,
    requiredLevel: magicLvlValues[index],
    spCost: index < 2 ? 43000 : index < 4 ? 50000 : index < 6 ? 65000 : index < 8 ? 91000 : index < 10 ? 100000 : index < 12 ? 150000 : index < 14 ? 170000 : index < 16 ? 200000 : index < 18 ? 310000 : 460000,
    mpCost: mpConsumeInitValues[index] + mpConsumeValues[index],
    power,
  })),
};

