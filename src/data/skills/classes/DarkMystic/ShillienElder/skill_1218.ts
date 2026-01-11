import { SkillDefinition } from "../../../types";

// Greater Battle Heal - 33 levels from XML
// power: 371.0, 384.0, 398.0, 426.0, 441.0, 455.0, 484.0, 499.0, 514.0, 544.0, 559.0, 574.0, 603.0, 618.0, 633.0, 647.0, 662.0, 676.0, 690.0, 704.0, 718.0, 731.0, 745.0, 758.0, 770.0, 783.0, 795.0, 806.0, 817.0, 828.0, 839.0, 849.0, 858.0
// mpConsume: 69, 72, 73, 76, 78, 81, 86, 88, 91, 96, 96, 98, 103, 106, 108, 111, 113, 116, 117, 117, 120, 122, 124, 126, 128, 131, 133, 134, 136, 138, 140, 142, 143
const greaterBattleHealPower = [371.0, 384.0, 398.0, 426.0, 441.0, 455.0, 484.0, 499.0, 514.0, 544.0, 559.0, 574.0, 603.0, 618.0, 633.0, 647.0, 662.0, 676.0, 690.0, 704.0, 718.0, 731.0, 745.0, 758.0, 770.0, 783.0, 795.0, 806.0, 817.0, 828.0, 839.0, 849.0, 858.0];
const greaterBattleHealMp = [69, 72, 73, 76, 78, 81, 86, 88, 91, 96, 96, 98, 103, 106, 108, 111, 113, 116, 117, 117, 120, 122, 124, 126, 128, 131, 133, 134, 136, 138, 140, 142, 143];

export const skill_1218: SkillDefinition = {
  id: 1218,
  code: "DME_1218",
  name: "Greater Battle Heal",
  description: "Quickly recovers HP.\n\nБыстро восстанавливает HP.",
  icon: "/skills/skill1218.gif",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 2,
  cooldown: 3,
  levels: greaterBattleHealPower.map((power, index) => ({
    level: index + 1,
    requiredLevel: index < 3 ? 40 : index < 6 ? 44 : index < 9 ? 48 : index < 12 ? 52 : index < 15 ? 56 : index < 18 ? 58 : index < 21 ? 60 : index < 24 ? 62 : index < 27 ? 64 : index < 30 ? 66 : 68,
    spCost: index < 3 ? 19000 : index < 6 ? 43000 : index < 9 ? 110000 : index < 12 ? 250000 : index < 15 ? 350000 : index < 18 ? 470000 : index < 21 ? 680000 : index < 24 ? 1000000 : index < 27 ? 1400000 : index < 30 ? 2100000 : 3000000,
    mpCost: greaterBattleHealMp[index],
    power,
  })),
};
