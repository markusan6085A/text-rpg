import { SkillDefinition } from "../../../types";

export const skill_0213: SkillDefinition = {
  id: 213,
  code: "HM_0213",
  name: " MP",
  description: "Описание умения.",
  icon: "/skills/skill0213.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    {
      stat: "maxMp",
      mode: "flat"
    }
  ],
  stackType: "boost_mana",
  stackOrder: 1,
  levels: [
    {
      level: 3,
      requiredLevel: 40,
      spCost: 31000,
      mpCost: 0,
      power: 70
    },
    {
      level: 4,
      requiredLevel: 48,
      spCost: 63000,
      mpCost: 0,
      power: 100
    },
    {
      level: 5,
      requiredLevel: 56,
      spCost: 110000,
      mpCost: 0,
      power: 140
    },
    {
      level: 6,
      requiredLevel: 60,
      spCost: 270000,
      mpCost: 0,
      power: 152
    },
    {
      level: 7,
      requiredLevel: 66,
      spCost: 700000,
      mpCost: 0,
      power: 180
    },
    {
      level: 8,
      requiredLevel: 72,
      spCost: 1700000,
      mpCost: 0,
      power: 200
    }
  ]
};

