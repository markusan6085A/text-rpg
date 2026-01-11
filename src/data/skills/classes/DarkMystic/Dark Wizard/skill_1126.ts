import { SkillDefinition } from "../../../types";

// Servitor Recharge - 34 levels from XML
// power: 41.0, 44.0, 49.0, 52.0, 57.0, 60.0, 66.0, 70.0, 73.0, 77.0, 81.0, 86.0, 90.0, 94.0, 98.0, 102.0, 104.0, 106.0, 108.0, 110.0, 113.0, 115.0, 116.0, 118.0, 120.0, 122.0, 124.0, 126.0, 128.0, 129.0, 131.0, 133.0, 134.0, 136.0
const servitorRechargePower = [41.0, 44.0, 49.0, 52.0, 57.0, 60.0, 66.0, 70.0, 73.0, 77.0, 81.0, 86.0, 90.0, 94.0, 98.0, 102.0, 104.0, 106.0, 108.0, 110.0, 113.0, 115.0, 116.0, 118.0, 120.0, 122.0, 124.0, 126.0, 128.0, 129.0, 131.0, 133.0, 134.0, 136.0];
const servitorRechargeMp = [33, 35, 39, 42, 45, 48, 53, 56, 59, 62, 65, 69, 72, 75, 78, 82, 83, 85, 87, 88, 90, 92, 93, 95, 96, 98, 99, 101, 102, 104, 105, 106, 108, 109];
const servitorRechargeMpInit = [9, 9, 10, 11, 12, 12, 14, 14, 15, 16, 17, 18, 18, 19, 20, 21, 21, 22, 22, 22, 23, 23, 24, 24, 24, 25, 25, 26, 26, 26, 27, 27, 27, 28];

export const skill_1126: SkillDefinition = {
  id: 1126,
  code: "DW_1126",
  name: "Servitor Recharge",
  description: "Recovers a Servitor's MP. Power 41-136.\n\nЭффект Servitor Recharge, кастуется на саммона, действует в пределах дальности 400: - Прибавляет 41-136 MP цели, зависит от разности уровней.",
  icon: "/skills/Skill1126_0.jpg",
  category: "heal",
  powerType: "damage",
  target: "self", // Special: targets summon (handled in useSkill.ts)
  scope: "single",
  castTime: 4,
  cooldown: 12,
  levels: servitorRechargePower.map((power, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 25 : index < 4 ? 30 : index < 6 ? 35 : index < 8 ? 40 : index < 10 ? 45 : index < 12 ? 50 : index < 14 ? 55 : index < 16 ? 60 : index < 18 ? 65 : index < 20 ? 70 : index < 22 ? 72 : index < 24 ? 74 : index < 26 ? 76 : index < 28 ? 77 : index < 30 ? 78 : index < 32 ? 79 : 80,
    spCost: index < 2 ? 2900 : index < 4 ? 5500 : index < 6 ? 9300 : index < 8 ? 15000 : index < 10 ? 25000 : index < 12 ? 40000 : index < 14 ? 60000 : index < 16 ? 80000 : index < 18 ? 100000 : index < 20 ? 120000 : index < 22 ? 150000 : index < 24 ? 200000 : index < 26 ? 250000 : index < 28 ? 300000 : index < 30 ? 350000 : index < 32 ? 400000 : 500000,
    mpCost: servitorRechargeMpInit[index] + servitorRechargeMp[index],
    power,
  })),
};

