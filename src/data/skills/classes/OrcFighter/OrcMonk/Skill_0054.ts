import { SkillDefinition } from "../../../types";

export const Skill_0054: SkillDefinition = {
  id: 54,
  code: "OM_0054",
  name: "Force Blaster",
  description: "By discharging force, an attack on a distant enemy can be made. Usable when a fist weapon is equipped.\n\nРазряжая силу, можно атаковать дальнего врага. Используется при экипировке оружия для рукопашного боя.",
  icon: "/skills/skill0054.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.9,
  cooldown: 15,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 24, spCost: 3300, mpCost: 19, power: 143 },
    { level: 2, requiredLevel: 24, spCost: 3300, mpCost: 20, power: 154 },
    { level: 3, requiredLevel: 24, spCost: 3300, mpCost: 21, power: 166 },
    { level: 4, requiredLevel: 28, spCost: 5700, mpCost: 22, power: 193 },
    { level: 5, requiredLevel: 28, spCost: 5700, mpCost: 23, power: 207 },
    { level: 6, requiredLevel: 28, spCost: 5700, mpCost: 24, power: 222 },
    { level: 7, requiredLevel: 32, spCost: 9500, mpCost: 26, power: 256 },
    { level: 8, requiredLevel: 32, spCost: 9500, mpCost: 26, power: 274 },
    { level: 9, requiredLevel: 32, spCost: 9500, mpCost: 27, power: 293 },
    { level: 10, requiredLevel: 36, spCost: 13000, mpCost: 29, power: 334 },
    { level: 11, requiredLevel: 36, spCost: 13000, mpCost: 30, power: 357 },
    { level: 12, requiredLevel: 36, spCost: 13000, mpCost: 31, power: 380 },
  ],
};

