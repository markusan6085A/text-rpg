import { SkillDefinition } from "../../../types";

export const skill_1078: SkillDefinition = {
  id: 1078,
  code: "HM_1078",
  name: "Concentration",
  description: "Temporarily lowers the probability of magic being canceled due to damage. Effect 1.\n\nВременно снижает вероятность прерывания магии при получении урона. Эффект 1.",
  icon: "/skills/skill1078.gif",
  levels: [
    {
      level: 3,
      requiredLevel: 44,
      spCost: 39000,
      mpCost: 39,
      power: 20
    },
    {
      level: 4,
      requiredLevel: 52,
      spCost: 100000,
      mpCost: 48,
      power: 20
    },
    {
      level: 5,
      requiredLevel: 60,
      spCost: 270000,
      mpCost: 55,
      power: 20
    },
    {
      level: 6,
      requiredLevel: 68,
      spCost: 770000,
      mpCost: 64,
      power: 20
    }
  ]
};

