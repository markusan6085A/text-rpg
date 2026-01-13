import { SkillDefinition } from "../../../types";

export const skill_1129: SkillDefinition = {
  id: 1129,
  code: "HM_1129",
  name: "Summon Reanimated Man",
  description: "Summons a Reanimated Man. Requires 2 Crystals: C-Grade. Afterwards, an additional 1 crystal will be consumed at a regular interval for 4 times. 15% of acquired Exp will be consumed.",
  icon: "/skills/skill1129.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 20,
  levels: [
    {
      level: 1,
      requiredLevel: 44,
      spCost: 35000,
      mpCost: 78,
      power: 0,
    },
    {
      level: 2,
      requiredLevel: 52,
      spCost: 78000,
      mpCost: 94,
      power: 0,
    },
    {
      level: 3,
      requiredLevel: 60,
      spCost: 130000,
      mpCost: 110,
      power: 0,
    },
    {
      level: 4,
      requiredLevel: 64,
      spCost: 200000,
      mpCost: 119,
      power: 0,
    },
    {
      level: 5,
      requiredLevel: 68,
      spCost: 330000,
      mpCost: 127,
      power: 0,
    },
    {
      level: 6,
      requiredLevel: 72,
      spCost: 610000,
      mpCost: 133,
      power: 0,
    },
    {
      level: 7,
      requiredLevel: 74,
      spCost: 920000,
      mpCost: 137,
      power: 0,
    },
  ],
};

