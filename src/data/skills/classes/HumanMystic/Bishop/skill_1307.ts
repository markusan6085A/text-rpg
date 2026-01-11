import { SkillDefinition } from "../../../types";

export const skill_1307: SkillDefinition = {
  id: 1307,
  code: "HM_1307",
  name: "Prayer",
  description: "Temporarily increases the effectiveness of HP recovery magic for party members. Effect 1.",
  icon: "/skills/skill1307.gif",
  category: "buff",
  powerType: "percent",
  effects: [{ stat: "healPower", mode: "percent" }],
  target: "party",
  scope: "party",
  duration: 1200,
  levels: [
  {
    level: 1,
    requiredLevel: 40,
    mpCost: 244,
    spCost: 1410000,
    power: 8
  },
  {
    level: 2,
    requiredLevel: 41,
    mpCost: 259,
    spCost: 2590000,
    power: 10
  },
  {
    level: 3,
    requiredLevel: 42,
    mpCost: 272,
    spCost: 31300000,
    power: 12
  }
]
};

