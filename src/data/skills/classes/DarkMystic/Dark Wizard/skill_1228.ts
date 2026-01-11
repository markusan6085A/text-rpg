import { SkillDefinition } from "../../../types";

// Summon Silhouette - 18 levels from XML
// mpConsume: 31, 35, 42, 48, 56, 62, 69, 75, 82, 85, 88, 92, 95, 98, 101, 104, 106, 109
// mpConsume_Init: 8, 9, 11, 12, 14, 16, 18, 19, 21, 22, 22, 23, 24, 25, 26, 26, 27, 28
// itemConsumeCount: 1 (always)
// expPenalty: 0.9 (90%)
const summonSilhouetteMp = [31, 35, 42, 48, 56, 62, 69, 75, 82, 85, 88, 92, 95, 98, 101, 104, 106, 109];
const summonSilhouetteMpInit = [8, 9, 11, 12, 14, 16, 18, 19, 21, 22, 22, 23, 24, 25, 26, 26, 27, 28];

export const skill_1228: SkillDefinition = {
  id: 1228,
  code: "DW_1228",
  name: "Summon Silhouette",
  description: "Summons a Silhouette. The Silhouette will use attack magic to assist during combat. Requires 1 Crystal: D-Grade. 90% of acquired Exp is consumed.\n\nЭффект Summon Silhouette, кастуется на себя: - Вызывает Silhouette. Вызванное существо забирает 90% опыта, получаемого в бою.",
  icon: "/skills/Skill1228_0.jpg",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 15,
  cooldown: 21600, // 6 hours
  levels: summonSilhouetteMp.map((mp, index) => ({
    level: index + 1,
    requiredLevel: index < 4 ? 20 : index < 8 ? 25 : index < 12 ? 30 : index < 16 ? 35 : 40,
    spCost: index < 4 ? 3300 : index < 8 ? 5800 : index < 12 ? 11000 : index < 16 ? 18000 : 30000,
    mpCost: summonSilhouetteMpInit[index] + mp,
    power: 0,
  })),
};

