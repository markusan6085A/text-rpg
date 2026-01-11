import { SkillDefinition } from "../../../types";

// Servitor Heal - 45 levels from XML
// power: 145.0, 162.0, 181.0, 212.0, 222.0, 234.0, 269.0, 281.0, 294.0, 333.0, 347.0, 361.0, 404.0, 419.0, 434.0, 465.0, 481.0, 496.0, 528.0, 544.0, 561.0, 593.0, 609.0, 626.0, 658.0, 674.0, 690.0, 706.0, 722.0, 737.0, 753.0, 768.0, 783.0, 798.0, 812.0, 826.0, 840.0, 854.0, 867.0, 879.0, 892.0, 904.0, 915.0, 926.0, 936.0
const servitorHealPower = [145.0, 162.0, 181.0, 212.0, 222.0, 234.0, 269.0, 281.0, 294.0, 333.0, 347.0, 361.0, 404.0, 419.0, 434.0, 465.0, 481.0, 496.0, 528.0, 544.0, 561.0, 593.0, 609.0, 626.0, 658.0, 674.0, 690.0, 706.0, 722.0, 737.0, 753.0, 768.0, 783.0, 798.0, 812.0, 826.0, 840.0, 854.0, 867.0, 879.0, 892.0, 904.0, 915.0, 926.0, 936.0];
const servitorHealMp = [19, 21, 24, 26, 28, 29, 33, 35, 35, 38, 40, 41, 46, 48, 49, 51, 52, 54, 57, 59, 61, 64, 64, 66, 69, 71, 72, 74, 76, 77, 78, 78, 80, 81, 83, 84, 86, 87, 89, 90, 91, 92, 93, 95, 96];
const servitorHealMpInit = [5, 6, 6, 7, 7, 8, 9, 9, 9, 10, 10, 11, 12, 12, 13, 13, 13, 14, 15, 15, 16, 16, 16, 17, 18, 18, 18, 19, 19, 20, 20, 20, 20, 21, 21, 21, 22, 22, 23, 23, 23, 23, 24, 24, 24];

export const skill_1127: SkillDefinition = {
  id: 1127,
  code: "DW_1127",
  name: "Servitor Heal",
  description: "Recovers servitor's HP. Power 145-936.\n\nЭффект Servitor Heal, кастуется на саммона, действует в пределах дальности 600: - Лечение силой 145-936.",
  icon: "/skills/Skill1127_0.jpg",
  category: "heal",
  powerType: "damage",
  target: "self", // Special: targets summon (handled in useSkill.ts)
  scope: "single",
  castTime: 4,
  cooldown: 10,
  levels: servitorHealPower.map((power, index) => ({
    level: index + 1,
    requiredLevel: index < 3 ? 20 : index < 6 ? 25 : index < 9 ? 30 : index < 12 ? 35 : index < 15 ? 40 : index < 18 ? 45 : index < 21 ? 50 : index < 24 ? 55 : index < 27 ? 60 : index < 30 ? 65 : index < 33 ? 70 : index < 36 ? 72 : index < 39 ? 74 : index < 42 ? 76 : 78,
    spCost: index < 3 ? 1100 : index < 6 ? 1900 : index < 9 ? 3700 : index < 12 ? 6200 : index < 15 ? 10000 : index < 18 ? 15000 : index < 21 ? 22000 : index < 24 ? 30000 : index < 27 ? 40000 : index < 30 ? 50000 : index < 33 ? 60000 : index < 36 ? 70000 : index < 39 ? 80000 : index < 42 ? 90000 : 100000,
    mpCost: servitorHealMpInit[index] + servitorHealMp[index],
    power,
  })),
};

