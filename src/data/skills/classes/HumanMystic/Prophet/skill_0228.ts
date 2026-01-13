import { SkillDefinition } from "../../../types";

export const skill_0228: SkillDefinition = {
  id: 228,
  code: "HM_0228",
  name: "Fast Spell Casting",
  description: "Increases spell casting speed.\n\nУвеличивает скорость каста заклинаний.",
  icon: "/skills/skill0228.gif",
  levels: [
    {
      level: 2,
      requiredLevel: 40,
      spCost: 31000,
      mpCost: 0,
      power: 7
    },
    {
      level: 3,
      requiredLevel: 56,
      spCost: 110000,
      mpCost: 0,
      power: 10
    }
  ]
};

