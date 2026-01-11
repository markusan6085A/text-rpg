import { SkillDefinition } from "../../../types";

// Ice Bolt - 6 levels from XML
// power: 8.0, 9.0, 11.0, 13.0, 14.0, 16.0
// mpConsume: 7, 8, 11, 12, 14, 16
// Reduces run speed by 30% (multiplier 0.7) for 30 seconds
const iceBoltPower = [8.0, 9.0, 11.0, 13.0, 14.0, 16.0];
const iceBoltMp = [7, 8, 11, 12, 14, 16];

export const skill_1184: SkillDefinition = {
  id: 1184,
  code: "DM_1184",
  name: "Ice Bolt",
  description: "Freezing attack that slows enemy's speed. Water element.\n\nЛедяная атака, замедляющая скорость врага.",
  icon: "/skills/Skill1184_0.jpg",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  element: "water",
  chance: 60,
  castTime: 3.1,
  cooldown: 8,
  effects: [{ stat: "runSpeed", mode: "multiplier", multiplier: 0.7 }], // 30% speed reduction
  levels: iceBoltPower.map((power, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 7 : index < 4 ? 14 : index < 6 ? 20 : 30,
    spCost: index < 2 ? 240 : index < 4 ? 1100 : index < 6 ? 3000 : 8000,
    mpCost: iceBoltMp[index],
    power,
  })),
};



