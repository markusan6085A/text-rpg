import { SkillDefinition } from "../../../types";

export const skill_1271: SkillDefinition = {
  id: 1271,
  code: "HM_1271",
  name: "Benediction",
  description: "Fully regenerates party members' HP. Can only be used when one's own remaining HP is 25% or less.",
  icon: "/skills/skill1271.gif",
  category: "heal",
  powerType: "percent",
  target: "party",
  scope: "party",
  cooldown: 3600,
  levels: [
  {
    level: 1,
    requiredLevel: 66,
    mpCost: 214,
    spCost: 410000,
    power: 100
  }
]
};

