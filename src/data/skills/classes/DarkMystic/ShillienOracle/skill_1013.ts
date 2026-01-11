import { SkillDefinition } from "../../../types";

// Recharge - 32 levels from XML
// power: 49.0, 52.0, 57.0, 60.0, 66.0, 70.0, 73.0, 77.0, 81.0, 86.0, 90.0, 94.0, 98.0, 102.0, 104.0, 106.0, 108.0, 110.0, 113.0, 115.0, 116.0, 118.0, 120.0, 122.0, 124.0, 126.0, 128.0, 129.0, 131.0, 133.0, 134.0, 136.0
// mpConsume: 39, 42, 45, 48, 53, 56, 59, 62, 65, 69, 72, 75, 78, 82, 83, 85, 87, 88, 90, 92, 93, 95, 96, 98, 99, 101, 102, 104, 105, 106, 108, 109
const rechargePower = [49.0, 52.0, 57.0, 60.0, 66.0, 70.0, 73.0, 77.0, 81.0, 86.0, 90.0, 94.0, 98.0, 102.0, 104.0, 106.0, 108.0, 110.0, 113.0, 115.0, 116.0, 118.0, 120.0, 122.0, 124.0, 126.0, 128.0, 129.0, 131.0, 133.0, 134.0, 136.0];
const rechargeMp = [39, 42, 45, 48, 53, 56, 59, 62, 65, 69, 72, 75, 78, 82, 83, 85, 87, 88, 90, 92, 93, 95, 96, 98, 99, 101, 102, 104, 105, 106, 108, 109];

export const skill_1013: SkillDefinition = {
  id: 1013,
  code: "DMO_1013",
  name: "Recharge",
  description: "Restores MP.\n\nВосстанавливает MP.",
  icon: "/skills/skill1013.gif",
  category: "special",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 6,
  cooldown: 12,
  levels: rechargePower.map((power, index) => ({
    level: index + 1,
    requiredLevel: index < 4 ? 20 : index < 8 ? 25 : index < 12 ? 30 : index < 16 ? 35 : index < 20 ? 40 : index < 24 ? 45 : index < 28 ? 50 : 55,
    spCost: index < 4 ? 5800 : index < 8 ? 12000 : index < 12 ? 25000 : index < 16 ? 50000 : index < 20 ? 80000 : index < 24 ? 120000 : index < 28 ? 160000 : 200000,
    mpCost: rechargeMp[index],
    power,
  })),
};

