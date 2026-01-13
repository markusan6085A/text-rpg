import { SkillDefinition } from "../../../types";

// Higher Mana Gain - 27 levels from XML (passive)
// gainMp: 22, 24, 28, 29, 31, 32, 38, 39, 41, 42, 48, 49, 50, 52, 53, 59, 61, 62, 64, 66, 72, 73, 75, 76, 78, 79, 81
const gainMpValues = [22, 24, 28, 29, 31, 32, 38, 39, 41, 42, 48, 49, 50, 52, 53, 59, 61, 62, 64, 66, 72, 73, 75, 76, 78, 79, 81];

export const skill_0285: SkillDefinition = {
  id: 285,
  code: "DW_0285",
  name: "Higher Mana Gain",
  description: "Increases the recovery rate when MP is being recovered by recharge.\n\nУвеличивает восполняемые при Recharge MP на 22-81.",
  icon: "/skills/skill0285.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "mpRegen", mode: "flat" }],
  levels: gainMpValues.map((gain, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 20 : index < 4 ? 25 : index < 6 ? 30 : index < 8 ? 35 : index < 10 ? 40 : index < 12 ? 45 : index < 14 ? 50 : index < 16 ? 55 : index < 18 ? 60 : index < 20 ? 65 : index < 22 ? 70 : index < 24 ? 72 : index < 26 ? 74 : 76,
    spCost: index < 2 ? 1600 : index < 4 ? 3200 : index < 6 ? 6400 : index < 8 ? 12000 : index < 10 ? 20000 : index < 12 ? 35000 : index < 14 ? 50000 : index < 16 ? 80000 : index < 18 ? 120000 : index < 20 ? 160000 : index < 22 ? 200000 : index < 24 ? 300000 : index < 26 ? 500000 : 800000,
    mpCost: 0,
    power: gain,
  })),
};

