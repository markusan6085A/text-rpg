import { SkillDefinition } from "../../../types";

export const skill_0285: SkillDefinition = {
  id: 285,
  code: "HM_0285",
  name: "Higher Mana Gain",
  description: "Increases the recovery rate when MP is being recovered by recharge. -\n\nУвеличивает восполняемые при Recharge MP на 22%. Пассивный навык.",
  icon: "/skills/skill0285.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
  {
    "stat": "mpRegen",
    "mode": "flat"
  }
],
  levels: [
  {
    "level": 1,
    "requiredLevel": 20,
    "spCost": 1400,
    "mpCost": 0,
    "power": 0.6
  },
  {
    "level": 2,
    "requiredLevel": 20,
    "spCost": 1400,
    "mpCost": 0,
    "power": 0.8
  },
  {
    "level": 3,
    "requiredLevel": 25,
    "spCost": 2800,
    "mpCost": 0,
    "power": 1.0
  },
  {
    "level": 4,
    "requiredLevel": 25,
    "spCost": 2800,
    "mpCost": 0,
    "power": 1.2
  },
  {
    "level": 5,
    "requiredLevel": 30,
    "spCost": 5300,
    "mpCost": 0,
    "power": 1.4
  },
  {
    "level": 6,
    "requiredLevel": 30,
    "spCost": 5300,
    "mpCost": 0,
    "power": 1.6
  },
  {
    "level": 7,
    "requiredLevel": 35,
    "spCost": 8800,
    "mpCost": 0,
    "power": 1.8
  },
  {
    "level": 8,
    "requiredLevel": 35,
    "spCost": 8800,
    "mpCost": 0,
    "power": 2.0
  }
]
};
