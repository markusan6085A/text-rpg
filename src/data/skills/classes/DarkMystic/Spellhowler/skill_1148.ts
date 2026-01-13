import { SkillDefinition } from "../../../types";

// Death Spike - 13 levels from XML
// Power: 58, 65, 72, 78, 82, 85, 89, 92, 96, 99, 102, 105, 108
// mpConsume: 23, 27, 30, 35, 36, 38, 40, 41, 43, 45, 46, 47, 50
// mpConsume_Init: 4, 5, 6, 7, 7, 8, 8, 8, 9, 9, 9, 9, 10
const powerValues = [58, 65, 72, 78, 82, 85, 89, 92, 96, 99, 102, 105, 108];
const mpConsumeInitValues = [4, 5, 6, 7, 7, 8, 8, 8, 9, 9, 9, 9, 10];
const mpConsumeValues = [19, 22, 24, 28, 29, 30, 32, 33, 34, 36, 37, 38, 40];
const magicLvlValues = [44, 48, 52, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74];

export const skill_1148: SkillDefinition = {
  id: 1148,
  code: "SP_1148",
  name: "Death Spike",
  description: "Damages an enemy by throwing a bone. Power 58. 1 Cursed Bone needed.\n\nАтака тьмой, кастуется на врагов, действует в пределах дальности 900: - Магическая атака силой 58-108. - Требует 1 шт. × Cursed Bone.",
  icon: "/skills/skill1148.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "dark",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  // Note: Requires 1 Cursed Bone (item ID 2509) - handled in useSkill.ts
  levels: powerValues.map((power, index) => ({
    level: index + 1,
    requiredLevel: magicLvlValues[index],
    spCost: index < 2 ? 39000 : index < 4 ? 60000 : index < 6 ? 86000 : index < 8 ? 130000 : index < 10 ? 200000 : index < 12 ? 410000 : 920000,
    mpCost: mpConsumeInitValues[index] + mpConsumeValues[index],
    power,
  })),
};

