import { SkillDefinition } from "../../../types";

export const skill_1311: SkillDefinition = {
  id: 1311,
  code: "HM_1311",
  name: "Body of Avatar",
  description: "For a certain time period, increases one's party members' maximum HP and restores the increased portion of their HP. Effect 1.",
  icon: "/skills/skill1311.gif",
  category: "buff",
  powerType: "percent",
  effects: [{ stat: "maxHp", mode: "percent" }],
  target: "party",
  scope: "party",
  duration: 1200,
  levels: [
  {
    level: 1,
    requiredLevel: 40,
    mpCost: 342,
    spCost: 163000,
    power: 10
  },
  {
    level: 2,
    requiredLevel: 41,
    mpCost: 408,
    spCost: 2100000,
    power: 15
  },
  {
    level: 3,
    requiredLevel: 42,
    mpCost: 440,
    spCost: 3170000,
    power: 20
  },
  {
    level: 4,
    requiredLevel: 43,
    mpCost: 473,
    spCost: 4280000,
    power: 25
  },
  {
    level: 5,
    requiredLevel: 44,
    mpCost: 503,
    spCost: 5450000,
    power: 30
  },
  {
    level: 6,
    requiredLevel: 45,
    mpCost: 530,
    spCost: 940000,
    power: 35
  }
]
};

