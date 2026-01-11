import { SkillDefinition } from "../../../types";

export const skill_1016: SkillDefinition = {
  id: 1016,
  code: "HM_1016",
  name: "Resurrection",
  description: "Resurrects a corpse.",
  icon: "/skills/skill1016.gif",
  category: "special",
  powerType: "none",
  target: "ally",
  scope: "single",
  levels: [
  {
    level: 3,
    requiredLevel: 40,
    mpCost: 122,
    spCost: 336000,
    power: 30
  },
  {
    level: 4,
    requiredLevel: 41,
    mpCost: 152,
    spCost: 463000,
    power: 40
  },
  {
    level: 5,
    requiredLevel: 42,
    mpCost: 180,
    spCost: 5100000,
    power: 50
  },
  {
    level: 6,
    requiredLevel: 43,
    mpCost: 195,
    spCost: 6170000,
    power: 60
  },
  {
    level: 7,
    requiredLevel: 44,
    mpCost: 207,
    spCost: 7280000,
    power: 70
  },
  {
    level: 8,
    requiredLevel: 45,
    mpCost: 228,
    spCost: 8590000,
    power: 80
  },
  {
    level: 9,
    requiredLevel: 46,
    mpCost: 239,
    spCost: 91300000,
    power: 90
  }
]
};

