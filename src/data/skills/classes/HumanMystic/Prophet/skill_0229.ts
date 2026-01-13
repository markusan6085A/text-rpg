import { SkillDefinition } from "../../../types";

export const skill_0229: SkillDefinition = {
  id: 229,
  code: "HM_0229",
  name: "  MP",
  description: "Increases MP Recovery Speed.\n\nУвеличивает скорость восстановления MP.",
  icon: "/skills/skill0229.gif",
  levels: [
    {
      level: 3,
      requiredLevel: 44,
      spCost: 39000,
      mpCost: 0,
      power: 1.9
    },
    {
      level: 4,
      requiredLevel: 52,
      spCost: 100000,
      mpCost: 0,
      power: 2.3
    },
    {
      level: 5,
      requiredLevel: 60,
      spCost: 270000,
      mpCost: 0,
      power: 2.7
    },
    {
      level: 6,
      requiredLevel: 68,
      spCost: 770000,
      mpCost: 0,
      power: 3.1
    },
    {
      level: 7,
      requiredLevel: 74,
      spCost: 2600000,
      mpCost: 0,
      power: 3.4
    }
  ]
};

