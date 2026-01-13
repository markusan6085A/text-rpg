import { SkillDefinition } from "../../../types";

// Wind Shackle - 19 levels from XML
// pAtkSpd multipliers: 0.83, 0.8, 0.8, 0.8, 0.8, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77
// mpConsume: 2, 8, 9, 11, 12, 28, 31, 35, 38, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55
const shackleMultipliers = [0.83, 0.8, 0.8, 0.8, 0.8, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77, 0.77];
const shackleMp = [2, 8, 9, 11, 12, 28, 31, 35, 38, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55];

export const skill_1206: SkillDefinition = {
  id: 1206,
  code: "DMO_1206",
  name: "Wind Shackle",
  description: "Slows enemy attack speed for 15 seconds.\n\nЗамедляет скорость атаки врага на 15 секунд.",
  icon: "/skills/skill1206.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 8,
  duration: 15,
  chance: 80,
  effects: [{ stat: "attackSpeed", mode: "multiplier" }], // Value from level.power (multiplier)
  levels: shackleMultipliers.map((mult, index) => ({
    level: index + 1,
    requiredLevel: index < 1 ? 20 : index < 5 ? 25 : index < 10 ? 30 : index < 15 ? 40 : 50,
    spCost: index < 1 ? 3300 : index < 5 ? 6500 : index < 10 ? 12000 : index < 15 ? 30000 : 60000,
    mpCost: shackleMp[index],
    power: mult,
  })),
};

