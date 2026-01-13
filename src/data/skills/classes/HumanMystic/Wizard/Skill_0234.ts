import { SkillDefinition } from "../../../types";

export const skill_0234: SkillDefinition = {
  id: 234,
  code: "HM_0234",
  name: "Robe Mastery",
  description: "Increases P. Def. when wearing a robe.\n\nУвеличивает физ. защиту при ношении мантии.",
  icon: "/skills/skill0234.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    {
      stat: "pDef",
      mode: "flat"
    }
  ],
  levels: [
    {
      level: 1,
      requiredLevel: 20,
      spCost: 1400,
      mpCost: 0,
      power: 1.7
    },
    {
      level: 2,
      requiredLevel: 20,
      spCost: 1400,
      mpCost: 0,
      power: 2.7
    },
    {
      level: 3,
      requiredLevel: 25,
      spCost: 2800,
      mpCost: 0,
      power: 4.3
    },
    {
      level: 4,
      requiredLevel: 25,
      spCost: 2800,
      mpCost: 0,
      power: 5.4
    },
    {
      level: 5,
      requiredLevel: 30,
      spCost: 5300,
      mpCost: 0,
      power: 7.2
    },
    {
      level: 6,
      requiredLevel: 30,
      spCost: 5300,
      mpCost: 0,
      power: 8.5
    },
    {
      level: 7,
      requiredLevel: 35,
      spCost: 8800,
      mpCost: 0,
      power: 10.6
    },
    {
      level: 8,
      requiredLevel: 35,
      spCost: 8800,
      mpCost: 0,
      power: 12.1
    }
  ]
};
