import { SkillDefinition } from "../../../types";

// Curse: Weakness - 19 levels from XML
// pAtk multipliers: 0.83, 0.8, 0.8, 0.8, 0.8, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77
// mpConsume: 2, 8, 9, 11, 12, 28, 31, 35, 38, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55
const weaknessMultipliers = [0.83, 0.8, 0.8, 0.8, 0.8, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77];
const weaknessMp = [2, 8, 9, 11, 12, 28, 31, 35, 38, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55];

export const skill_1164: SkillDefinition = {
  id: 1164,
  code: "DM_1164",
  name: "Curse: Weakness",
  description: "Reduces target's P. Atk.\n\nУменьшает физ. атаку цели.",
  icon: "/skills/Skill1164_0.jpg",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  duration: 120,
  chance: 80,
  castTime: 1.5,
  cooldown: 15,
  effects: [{ stat: "pAtk", mode: "multiplier" }], // Value from level.power (multiplier)
  levels: weaknessMultipliers.map((mult, index) => ({
    level: index + 1,
    requiredLevel: index < 1 ? 14 : index < 5 ? 20 : index < 10 ? 30 : index < 15 ? 40 : 50,
    spCost: index < 1 ? 2100 : index < 5 ? 5000 : index < 10 ? 15000 : index < 15 ? 35000 : 60000,
    mpCost: weaknessMp[index],
    power: mult,
  })),
};



