import { SkillDefinition } from "../../../types";

export const skill_1254: SkillDefinition = {
  id: 1254,
  code: "HM_1254",
  name: "Mass Resurrection",
  description: "Resurrects dead alliance members.",
  icon: "/skills/skill1254.gif",
  category: "special",
  powerType: "none",
  target: "ally",
  scope: "area",
  levels: [
  {
    level: 1,
    requiredLevel: 40,
    mpCost: 243,
    spCost: 136000,
    power: 10
  },
  {
    level: 2,
    requiredLevel: 41,
    mpCost: 268,
    spCost: 241000,
    power: 20
  },
  {
    level: 3,
    requiredLevel: 42,
    mpCost: 327,
    spCost: 395000,
    power: 30
  },
  {
    level: 4,
    requiredLevel: 43,
    mpCost: 360,
    spCost: 4100000,
    power: 40
  },
  {
    level: 5,
    requiredLevel: 44,
    mpCost: 377,
    spCost: 5130000,
    power: 50
  },
  {
    level: 6,
    requiredLevel: 45,
    mpCost: 442,
    spCost: 6450000,
    power: 60
  }
]
};

