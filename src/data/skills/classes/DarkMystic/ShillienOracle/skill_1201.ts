import { SkillDefinition } from "../../../types";

// Dryad Root - 33 levels from XML
// mpConsume: 17, 17, 18, 20, 21, 21, 23, 24, 24, 27, 27, 28, 30, 30, 31, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55
const rootMp = [17, 17, 18, 20, 21, 21, 23, 24, 24, 27, 27, 28, 30, 30, 31, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55];

export const skill_1201: SkillDefinition = {
  id: 1201,
  code: "DMO_1201",
  name: "Dryad Root",
  description: "Roots a target in place for 30 seconds.\n\nОбездвиживает цель на 30 секунд.",
  icon: "/skills/skill1201.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 2.5,
  cooldown: 8,
  duration: 30,
  chance: 80,
  stackType: "root",
  stackOrder: 1,
  levels: rootMp.map((mp, index) => ({
    level: index + 1,
    requiredLevel: index < 4 ? 20 : index < 8 ? 25 : index < 12 ? 30 : index < 16 ? 35 : index < 20 ? 40 : index < 24 ? 45 : index < 28 ? 50 : 55,
    spCost: index < 4 ? 2200 : index < 8 ? 3900 : index < 12 ? 7700 : index < 16 ? 15000 : index < 20 ? 30000 : index < 24 ? 50000 : index < 28 ? 80000 : 120000,
    mpCost: mp,
    power: 0,
  })),
};

