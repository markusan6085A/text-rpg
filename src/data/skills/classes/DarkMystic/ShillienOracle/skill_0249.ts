import { SkillDefinition } from "../../../types";

// Weapon Mastery (levels 3-9 for Shillien Oracle) - continuation from common
// pAtk values from XML: 4.5, 5.7, 6.7, 8.3, 9.5, 11.6, 13.3
// mAtk values from XML: 5.7, 7.2, 8.3, 10.3, 11.9, 14.6, 16.6
// Note: Uses same logic as common skill_0249, but for levels 3-9
const oracleWmPAtk = [4.5, 5.7, 6.7, 8.3, 9.5, 11.6, 13.3];
const oracleWmMAtk = [5.7, 7.2, 8.3, 10.3, 11.9, 14.6, 16.6];

export const skill_0249: SkillDefinition = {
  id: 249,
  code: "DMO_0249",
  name: "Weapon Mastery",
  description: "Increases P. Atk. and M. Atk.\n\nУвеличивает физ. атаку и маг. атаку.",
  icon: "/skills/Skill0249_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "percent" },
    { stat: "mAtk", mode: "percent" },
    { stat: "pAtk", mode: "multiplier", multiplier: 1.45 },
    { stat: "mAtk", mode: "multiplier", multiplier: 1.17 },
  ],
  stackType: "weapon_mastery",
  stackOrder: 1,
  levels: oracleWmPAtk.map((pAtk, index) => ({
    level: index + 3, // Levels 3-9
    requiredLevel: index < 3 ? 20 : index < 5 ? 30 : 35,
    spCost: index < 3 ? 3300 : index < 5 ? 6600 : 11000,
    mpCost: 0,
    power: pAtk, // pAtk value, mAtk handled in applySkillPassives
  })),
};


