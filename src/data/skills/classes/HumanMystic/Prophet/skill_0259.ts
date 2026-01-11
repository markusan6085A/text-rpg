import { SkillDefinition } from "../../../types";

export const skill_0259: SkillDefinition = {
  id: 259,
  code: "HM_0259",
  name: "Heavy Armor Mastery",
  description: "Increases P. Def. when wearing heavy armor. -\n\nУвеличивает физ. защиту при ношении тяжелой брони. Также увеличивает скорость каста и скорость атаки на 1%.",
  icon: "/skills/skill0259.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    {
      stat: "pDef",
      mode: "flat"
    },
    {
      stat: "castSpeed",
      mode: "percent",
      value: 1
    },
    {
      stat: "attackSpeed",
      mode: "percent",
      value: 1
    }
  ],
  stackType: "heavy_armor_mastery",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 40,
      spCost: 11000,
      mpCost: 0,
      power: 14.8
    },
    {
      level: 2,
      requiredLevel: 40,
      spCost: 11000,
      mpCost: 0,
      power: 15.6
    },
    {
      level: 3,
      requiredLevel: 40,
      spCost: 11000,
      mpCost: 0,
      power: 16.5
    },
    {
      level: 4,
      requiredLevel: 44,
      spCost: 13000,
      mpCost: 0,
      power: 18.3
    },
    {
      level: 5,
      requiredLevel: 44,
      spCost: 13000,
      mpCost: 0,
      power: 19.2
    },
    {
      level: 6,
      requiredLevel: 44,
      spCost: 13000,
      mpCost: 0,
      power: 20.2
    },
    {
      level: 7,
      requiredLevel: 48,
      spCost: 21000,
      mpCost: 0,
      power: 22.1
    },
    {
      level: 8,
      requiredLevel: 48,
      spCost: 21000,
      mpCost: 0,
      power: 23.1
    },
    {
      level: 9,
      requiredLevel: 48,
      spCost: 21000,
      mpCost: 0,
      power: 24.1
    },
    {
      level: 10,
      requiredLevel: 52,
      spCost: 33000,
      mpCost: 0,
      power: 26.2
    },
    {
      level: 11,
      requiredLevel: 52,
      spCost: 33000,
      mpCost: 0,
      power: 27.3
    },
    {
      level: 12,
      requiredLevel: 52,
      spCost: 33000,
      mpCost: 0,
      power: 28.4
    },
    {
      level: 13,
      requiredLevel: 56,
      spCost: 35000,
      mpCost: 0,
      power: 30.6
    },
    {
      level: 14,
      requiredLevel: 56,
      spCost: 35000,
      mpCost: 0,
      power: 31.8
    },
    {
      level: 15,
      requiredLevel: 56,
      spCost: 35000,
      mpCost: 0,
      power: 33
    },
    {
      level: 16,
      requiredLevel: 58,
      spCost: 110000,
      mpCost: 0,
      power: 34.1
    },
    {
      level: 17,
      requiredLevel: 58,
      spCost: 110000,
      mpCost: 0,
      power: 35.3
    },
    {
      level: 18,
      requiredLevel: 60,
      spCost: 140000,
      mpCost: 0,
      power: 36.5
    },
    {
      level: 19,
      requiredLevel: 60,
      spCost: 140000,
      mpCost: 0,
      power: 37.8
    },
    {
      level: 20,
      requiredLevel: 62,
      spCost: 180000,
      mpCost: 0,
      power: 39
    },
    {
      level: 21,
      requiredLevel: 62,
      spCost: 180000,
      mpCost: 0,
      power: 40.3
    },
    {
      level: 22,
      requiredLevel: 64,
      spCost: 240000,
      mpCost: 0,
      power: 41.5
    },
    {
      level: 23,
      requiredLevel: 64,
      spCost: 240000,
      mpCost: 0,
      power: 42.8
    },
    {
      level: 24,
      requiredLevel: 66,
      spCost: 350000,
      mpCost: 0,
      power: 44.1
    },
    {
      level: 25,
      requiredLevel: 66,
      spCost: 350000,
      mpCost: 0,
      power: 45.4
    },
    {
      level: 26,
      requiredLevel: 68,
      spCost: 390000,
      mpCost: 0,
      power: 46.7
    },
    {
      level: 27,
      requiredLevel: 68,
      spCost: 390000,
      mpCost: 0,
      power: 48
    },
    {
      level: 28,
      requiredLevel: 70,
      spCost: 520000,
      mpCost: 0,
      power: 49.4
    },
    {
      level: 29,
      requiredLevel: 70,
      spCost: 520000,
      mpCost: 0,
      power: 50.7
    },
    {
      level: 30,
      requiredLevel: 72,
      spCost: 830000,
      mpCost: 0,
      power: 52
    },
    {
      level: 31,
      requiredLevel: 72,
      spCost: 830000,
      mpCost: 0,
      power: 53.4
    },
    {
      level: 32,
      requiredLevel: 74,
      spCost: 1300000,
      mpCost: 0,
      power: 54.7
    },
    {
      level: 33,
      requiredLevel: 74,
      spCost: 1300000,
      mpCost: 0,
      power: 56.1
    }
  ]
};

