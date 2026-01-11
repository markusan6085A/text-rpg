import { SkillDefinition } from "../../../types";

export const skill_1242: SkillDefinition = {
  id: 1242,
  code: "HM_1242",
  name: "Death Whisper",
  description: "Temporarily increases critical attack. Effect 1.\n\nВременно увеличивает критический урон. Эффект 1.",
  icon: "/skills/skill1242.gif",
  category: "buff",
  powerType: "percent",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 1200,
  effects: [
    {
      stat: "critDamage",
      mode: "percent",
      value: 35
    }
  ],
  stackType: "death_whisper",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 40,
      spCost: 31000,
      mpCost: 35,
      power: 1.35
    },
    {
      level: 2,
      requiredLevel: 48,
      spCost: 63000,
      mpCost: 44,
      power: 1.35
    },
    {
      level: 3,
      requiredLevel: 56,
      spCost: 110000,
      mpCost: 52,
      power: 1.35
    }
  ]
};

