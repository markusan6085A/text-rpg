import { SkillDefinition } from "../../../types";

// Weapon Mastery - 42 levels from XML
// pAtk values: 1.5, 2.8, 4.5, 5.7, 6.7, 8.3, 9.5, 11.6, 13.3, 16, 17, 18.1, 20.4, 21.6, 22.8, 25.5, 26.9, 28.3, 31.4, 33, 34.6, 38, 39.8, 41.7, 43.5, 45.4, 47.4, 49.4, 51.4, 53.5, 55.6, 57.7, 59.9, 62.0, 64.1, 66.8, 68.5, 70.7, 72.9, 75.1, 77.2, 79.4
// mAtk values: 1.9, 3.5, 5.7, 7.2, 8.3, 10.3, 11.9, 14.6, 16.6, 20, 21.3, 22.6, 25.4, 26.9, 28.5, 31.8, 33.6, 35.4, 39.2, 41.2, 43.2, 47.5, 49.8, 52.1, 54.4, 56.8, 59.2, 61.7, 64.3, 66.8, 69.4, 72.1, 74.8, 77.4, 80.2, 82.9, 85.6, 88.4, 91.1, 93.8, 96.5, 99.3
// mulpAtk: 1.45 (multiplier for all levels)
// mulmAtk: 1.17 (multiplier for all levels)
// Note: power stores pAtk value, mAtk value is calculated from level index
const pAtkValues = [1.5, 2.8, 4.5, 5.7, 6.7, 8.3, 9.5, 11.6, 13.3, 16, 17, 18.1, 20.4, 21.6, 22.8, 25.5, 26.9, 28.3, 31.4, 33, 34.6, 38, 39.8, 41.7, 43.5, 45.4, 47.4, 49.4, 51.4, 53.5, 55.6, 57.7, 59.9, 62.0, 64.1, 66.8, 68.5, 70.7, 72.9, 75.1, 77.2, 79.4];
const mAtkValues = [1.9, 3.5, 5.7, 7.2, 8.3, 10.3, 11.9, 14.6, 16.6, 20, 21.3, 22.6, 25.4, 26.9, 28.5, 31.8, 33.6, 35.4, 39.2, 41.2, 43.2, 47.5, 49.8, 52.1, 54.4, 56.8, 59.2, 61.7, 64.3, 66.8, 69.4, 72.1, 74.8, 77.4, 80.2, 82.9, 85.6, 88.4, 91.1, 93.8, 96.5, 99.3];

export const skill_0249: SkillDefinition = {
  id: 249,
  code: "DM_0249",
  name: "Weapon Mastery",
  description: "Increases P. Atk. and M. Atk.\n\nУвеличивает физ. атаку и маг. атаку.",
  icon: "/skills/Skill0249_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "percent" }, // Value from level.power (pAtk value)
    { stat: "mAtk", mode: "percent" }, // Value calculated from level index
    { stat: "pAtk", mode: "multiplier", multiplier: 1.45 }, // mulpAtk from XML
    { stat: "mAtk", mode: "multiplier", multiplier: 1.17 }, // mulmAtk from XML
  ],
  stackType: "weapon_mastery",
  stackOrder: 1,
  levels: pAtkValues.map((pAtk, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? (index === 0 ? 7 : 14) : index < 5 ? 20 : index < 7 ? 30 : index < 9 ? 35 : index < 10 ? 40 : index < 12 ? 43 : index < 15 ? 46 + (index - 12) * 3 : index < 20 ? 55 + (index - 15) * 2 : index < 30 ? 65 + (index - 20) : 80,
    spCost: index < 2 ? (index === 0 ? 470 : 2100) : index < 5 ? 3000 + index * 200 : index < 7 ? 6000 + (index - 5) * 300 : index < 9 ? 10000 + (index - 7) * 500 : index < 10 ? 15000 : index < 12 ? 15000 + (index - 10) * 2000 : index < 15 ? 20000 + (index - 12) * 5000 : index < 20 ? 35000 + (index - 15) * 5000 : index < 30 ? 60000 + (index - 20) * 5000 : 110000 + (index - 30) * 5000,
    mpCost: 0,
    power: pAtk, // Store pAtk value in power
    // mAtk value is mAtkValues[index], handled in applySkillPassives
  })),
};



