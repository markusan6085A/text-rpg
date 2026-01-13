import { SkillDefinition } from "../../../types";

// Weapon Mastery - increases P. Atk. and M. Atk.
// З XML: skill 249, levels="42", pAtk: 4.5-79.4, mAtk: 5.7-99.3
// Для Elven Oracle: рівні 3-9 (requiredLevel: 20-35)
// pAtk values: 4.5, 5.7, 6.7, 8.3, 9.5, 11.6, 13.3
// mAtk values: 5.7, 7.2, 8.3, 10.3, 11.9, 14.6, 16.6
const pAtkValues = [4.5, 5.7, 6.7, 8.3, 9.5, 11.6, 13.3];
const mAtkValues = [5.7, 7.2, 8.3, 10.3, 11.9, 14.6, 16.6];

export const skill_0142: SkillDefinition = {
  id: 142,
  code: "EO_0142",
  name: "Weapon Mastery",
  description: "Increases P. Atk. and M. Atk.\n\nУвеличивает физическую атаку на 4.5-13.3 (зависит от уровня).\nУвеличивает магическую атаку на 5.7-16.6 (зависит от уровня).\nУвеличивает физическую атаку на 45%.\nУвеличивает магическую атаку на 17%.",
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
    level: index + 3,
    requiredLevel: index < 1 ? 20 : index < 3 ? 25 : index < 5 ? 30 : 35,
    spCost: index < 1 ? 3300 : index < 3 ? 3200 : index < 5 ? 6200 : 10000,
    mpCost: 0,
    power: pAtk,
  })),
};

