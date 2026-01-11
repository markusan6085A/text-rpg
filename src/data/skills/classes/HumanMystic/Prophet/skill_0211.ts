import { SkillDefinition } from "../../../types";

export const skill_0211: SkillDefinition = {
  id: 211,
  code: "HM_0211",
  name: "Boost HP",
  description: "Increases one's maximum HP.\n\nУвеличивает максимальный HP.",
  icon: "/skills/skill0211.gif",
  levels: [
    {
      level: 1,
      requiredLevel: 40,
      spCost: 31000,
      mpCost: 0,
      power: 60
    },
    {
      level: 2,
      requiredLevel: 44,
      spCost: 39000,
      mpCost: 0,
      power: 100
    },
    {
      level: 3,
      requiredLevel: 48,
      spCost: 63000,
      mpCost: 0,
      power: 150
    },
    {
      level: 4,
      requiredLevel: 52,
      spCost: 100000,
      mpCost: 0,
      power: 200
    },
    {
      level: 5,
      requiredLevel: 56,
      spCost: 110000,
      mpCost: 0,
      power: 250
    },
    {
      level: 6,
      requiredLevel: 62,
      spCost: 360000,
      mpCost: 0,
      power: 300
    },
    {
      level: 7,
      requiredLevel: 70,
      spCost: 1000000,
      mpCost: 0,
      power: 350
    }
  ]
};

