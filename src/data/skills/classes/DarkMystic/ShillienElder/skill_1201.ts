import { SkillDefinition } from "../../../types";

// Dryad Root - continuation from Oracle (levels 13-33 for Shillien Elder)
// mpConsume from XML: 30, 30, 31, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55
const elderRootMp = [30, 30, 31, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55];

export const skill_1201: SkillDefinition = {
  id: 1201,
  code: "DME_1201",
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
  levels: elderRootMp.map((mp, index) => ({
    level: index + 13, // Levels 13-33
    requiredLevel: index < 3 ? 40 : index < 6 ? 44 : index < 9 ? 48 : index < 12 ? 52 : index < 15 ? 56 : index < 18 ? 60 : index < 21 ? 64 : 68,
    spCost: index < 3 ? 13000 : index < 6 ? 15000 : index < 9 ? 29000 : index < 12 ? 38000 : index < 15 ? 48000 : index < 18 ? 92000 : index < 21 ? 130000 : 180000,
    mpCost: mp,
    power: 0,
  })),
};

