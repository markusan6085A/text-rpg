import { SkillDefinition } from "../../../types";

// Surrender To Earth - 15 levels from XML
// Reduces accuracy by: 12, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13
// mpConsume: 12, 28, 31, 35, 38, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55
const surrenderEarthAcc = [12, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13];
const surrenderEarthMp = [12, 28, 31, 35, 38, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55];

export const skill_1223: SkillDefinition = {
  id: 1223,
  code: "DME_1223",
  name: "Surrender To Earth",
  description: "Reduces target's accuracy for 15 seconds.\n\nСнижает точность цели на 15 секунд.",
  icon: "/skills/skill1223.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 8,
  duration: 15,
  chance: 80,
  effects: [{ stat: "accuracy", mode: "flat" }], // Value from level.power (negative)
  levels: surrenderEarthAcc.map((acc, index) => ({
    level: index + 1,
    requiredLevel: index < 3 ? 35 : index < 6 ? 40 : index < 9 ? 44 : index < 12 ? 48 : 52,
    spCost: index < 3 ? 39000 : index < 6 ? 85000 : index < 9 ? 140000 : index < 12 ? 200000 : 300000,
    mpCost: surrenderEarthMp[index],
    power: -acc, // Negative for reduction
  })),
};
