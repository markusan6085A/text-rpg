import { SkillDefinition } from "../../../types";

export const skill_1272: SkillDefinition = {
  id: 1272,
  code: "HM_1272",
  name: "Word of Fear",
  description: "Instills fear into one's enemies and causes them to flee.\n\nВселяет страх во врагов и заставляет их бежать.",
  icon: "/skills/skill1272.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 4,
  cooldown: 20,
  duration: 8,
  chance: 30,
  effects: [],
  stackType: "fear",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 44,
      spCost: 39000,
      mpCost: 117,
      power: 200
    },
    {
      level: 2,
      requiredLevel: 48,
      spCost: 63000,
      mpCost: 129,
      power: 200
    },
    {
      level: 3,
      requiredLevel: 52,
      spCost: 100000,
      mpCost: 140,
      power: 200
    },
    {
      level: 4,
      requiredLevel: 56,
      spCost: 110000,
      mpCost: 153,
      power: 200
    },
    {
      level: 5,
      requiredLevel: 58,
      spCost: 220000,
      mpCost: 159,
      power: 200
    },
    {
      level: 6,
      requiredLevel: 60,
      spCost: 270000,
      mpCost: 165,
      power: 200
    },
    {
      level: 7,
      requiredLevel: 62,
      spCost: 360000,
      mpCost: 172,
      power: 200
    },
    {
      level: 8,
      requiredLevel: 64,
      spCost: 480000,
      mpCost: 178,
      power: 200
    },
    {
      level: 9,
      requiredLevel: 66,
      spCost: 700000,
      mpCost: 184,
      power: 200
    },
    {
      level: 10,
      requiredLevel: 68,
      spCost: 770000,
      mpCost: 189,
      power: 200
    },
    {
      level: 11,
      requiredLevel: 70,
      spCost: 1000000,
      mpCost: 194,
      power: 200
    },
    {
      level: 12,
      requiredLevel: 72,
      spCost: 1700000,
      mpCost: 199,
      power: 200
    },
    {
      level: 13,
      requiredLevel: 74,
      spCost: 2600000,
      mpCost: 204,
      power: 200
    }
  ]
};

