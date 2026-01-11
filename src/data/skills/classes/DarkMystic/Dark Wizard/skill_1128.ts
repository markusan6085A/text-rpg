import { SkillDefinition } from "../../../types";

// Summon Shadow - 18 levels from XML
// mpConsume: 31, 35, 42, 48, 56, 62, 69, 75, 82, 85, 88, 92, 95, 98, 101, 104, 106, 109
// mpConsume_Init: 8, 9, 11, 12, 14, 16, 18, 19, 21, 22, 22, 23, 24, 25, 26, 26, 27, 28
// itemConsumeCount: 3, 4, 1, 3, 5, 3, 4, 4, 5, 6, 6, 7, 5, 6, 7, 9, 7, 8
// expPenalty: 0.3 (30%)
const summonShadowMp = [31, 35, 42, 48, 56, 62, 69, 75, 82, 85, 88, 92, 95, 98, 101, 104, 106, 109];
const summonShadowMpInit = [8, 9, 11, 12, 14, 16, 18, 19, 21, 22, 22, 23, 24, 25, 26, 26, 27, 28];
const summonShadowItemCount = [3, 4, 1, 3, 5, 3, 4, 4, 5, 6, 6, 7, 5, 6, 7, 9, 7, 8];

export const skill_1128: SkillDefinition = {
  id: 1128,
  code: "DW_1128",
  name: "Summon Shadow",
  description: "Summons a Shadow. Requires 3-8 Crystals: D-Grade. 30% of acquired Exp will be consumed.\n\nЭффект Summon Shadow, кастуется на себя: - Вызывает Shadow. Вызванное существо забирает 30% опыта, получаемого в бою.",
  icon: "/skills/Skill1128_0.jpg",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 15,
  cooldown: 21600, // 6 hours
  levels: summonShadowMp.map((mp, index) => ({
    level: index + 1,
    requiredLevel: index < 4 ? 20 : index < 8 ? 25 : index < 12 ? 30 : index < 16 ? 35 : 40,
    spCost: index < 4 ? 3300 : index < 8 ? 5800 : index < 12 ? 11000 : index < 16 ? 18000 : 30000,
    mpCost: summonShadowMpInit[index] + mp,
    power: 0,
  })),
};

