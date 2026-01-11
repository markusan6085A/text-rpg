import { SkillDefinition } from "../../../types";

export const skill_1018: SkillDefinition = {
  id: 1018,
  code: "HM_1018",
  name: "Purify",
  description: "Heals paralysis, cures poisoning and stops bleeding with the effect of 3 or less.",
  icon: "/skills/skill1018.gif",
  category: "special",
  powerType: "none",
  target: "ally",
  scope: "single",
  castTime: 4,
  cooldown: 15,
  levels: [
  {
    level: 1,
    requiredLevel: 40,
    mpCost: 39,
    spCost: 141000,
    power: 3
  },
  {
    level: 2,
    requiredLevel: 52,
    mpCost: 48,
    spCost: 295000,
    power: 6
  },
  {
    level: 3,
    requiredLevel: 62,
    mpCost: 55,
    spCost: 3270000,
    power: 9
  }
]
};

