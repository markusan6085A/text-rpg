import { SkillDefinition } from "../../../types";

// Weapon Mastery - continues from Elven Wizard level 9
const pAtkValues = [16, 17, 18.1, 20.4, 21.6, 22.8, 25.5, 26.9, 28.3, 31.4, 33, 34.6, 38, 39.8, 41.7, 43.5, 45.4, 47.4, 49.4, 51.4, 53.5, 55.6, 57.7, 59.9, 62.1, 64.1, 66.3, 68.5, 70.7, 72.9, 75.2, 77.5, 79.8, 82.2];
const mAtkValues = [20, 21.3, 22.6, 25.4, 26.9, 28.5, 31.8, 33.6, 35.4, 39.2, 41.2, 43.2, 47.5, 49.8, 52.1, 54.4, 56.8, 59.2, 61.7, 64.2, 66.9, 69.5, 72.1, 74.9, 77.6, 80.2, 83, 85.7, 88.4, 91.2, 94, 96.9, 99.7, 102.8];

export const skill_0142: SkillDefinition = {
  id: 142,
  code: "ES_0142",
  name: "Weapon Mastery",
  description: "Increases P. Atk. and M. Atk. when using a staff or wand.\n\nУвеличивает физическую атаку на 16-82.2 (зависит от уровня).\nУвеличивает магическую атаку на 20-102.8 (зависит от уровня).\nУвеличивает физическую атаку на 45%.\nУвеличивает магическую атаку на 17%.\nДоступно при использовании посоха или палочки.",
  icon: "/skills/skill0142.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "flat" },
    { stat: "mAtk", mode: "flat" },
    { stat: "pAtk", mode: "percent", value: 45 },
    { stat: "mAtk", mode: "percent", value: 17 },
  ],
  levels: pAtkValues.map((pAtk, index) => ({
    level: index + 10,
    requiredLevel: index < 3 ? 40 : index < 6 ? 44 : index < 9 ? 48 : index < 12 ? 52 : index < 15 ? 56 : index < 17 ? 58 : index < 19 ? 60 : index < 21 ? 62 : index < 23 ? 64 : index < 25 ? 66 : index < 27 ? 68 : index < 29 ? 70 : index < 31 ? 72 : 74,
    spCost: index < 3 ? 9000 : index < 6 ? 12000 : index < 9 ? 20000 : index < 12 ? 32000 : index < 15 ? 32000 : index < 17 ? 61000 : index < 19 ? 75000 : index < 21 ? 120000 : index < 23 ? 150000 : index < 25 ? 190000 : index < 27 ? 190000 : index < 29 ? 260000 : index < 31 ? 390000 : 550000,
    mpCost: 0,
    power: pAtk,
  })),
};

