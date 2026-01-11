import { SkillDefinition } from "../../../types";

const levels = [
  { level: 6, requiredLevel: 40, spCost: 39000, mpCost: 35, power: 0 },
  { level: 7, requiredLevel: 44, spCost: 43000, mpCost: 39, power: 0 },
  { level: 8, requiredLevel: 48, spCost: 85000, mpCost: 44, power: 0 },
  { level: 9, requiredLevel: 52, spCost: 110000, mpCost: 48, power: 0 },
  { level: 10, requiredLevel: 56, spCost: 140000, mpCost: 52, power: 0 },
  { level: 11, requiredLevel: 58, spCost: 180000, mpCost: 54, power: 0 },
  { level: 12, requiredLevel: 60, spCost: 250000, mpCost: 55, power: 0 },
  { level: 13, requiredLevel: 62, spCost: 360000, mpCost: 58, power: 0 },
  { level: 14, requiredLevel: 64, spCost: 480000, mpCost: 60, power: 0 },
  { level: 15, requiredLevel: 66, spCost: 700000, mpCost: 62, power: 0 },
  { level: 16, requiredLevel: 68, spCost: 700000, mpCost: 64, power: 0 },
  { level: 17, requiredLevel: 70, spCost: 940000, mpCost: 65, power: 0 },
  { level: 18, requiredLevel: 72, spCost: 1400000, mpCost: 67, power: 0 },
  { level: 19, requiredLevel: 74, spCost: 2100000, mpCost: 69, power: 0 }
];

export const skill_1207: SkillDefinition = {
  id: 1206,
  code: "DME_1206",
  name: "Wind Shackle",
  description: "Spirit of the Wind attacks, reducing target's Atk. Spd.\n\nАтака духом ветра, снижает скорость атаки цели.",
  icon: "/skills/skill1206.gif",
  category: "debuff",
  powerType: "percent",
  target: "enemy",
  scope: "single",
  duration: 30,
  castTime: 2.5,
  cooldown: 8,
  chance: 80,
  effects: [{ stat: "atkSpeed", mode: "percent", value: -30 }],
  stackType: "wind_shackle",
  stackOrder: 1,
  levels,
};
