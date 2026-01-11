import { SkillDefinition } from "../../../types";

export const skill_1258: SkillDefinition = {
  id: 1258,
  code: "HM_1258",
  name: "Restore Life",
  description: "Recovers HP by 15%.",
  icon: "/skills/skill1258.gif",
  category: "heal",
  powerType: "percent",
  target: "party",
  scope: "party",
  cooldown: 120,
  levels: [
  {
    level: 1,
    requiredLevel: 40,
    mpCost: 80,
    spCost: 141000,
    power: 15
  },
  {
    level: 2,
    requiredLevel: 41,
    mpCost: 107,
    spCost: 263000,
    power: 20
  },
  {
    level: 3,
    requiredLevel: 42,
    mpCost: 133,
    spCost: 395000,
    power: 25
  },
  {
    level: 4,
    requiredLevel: 43,
    mpCost: 159,
    spCost: 4100000,
    power: 30
  }
]
};

