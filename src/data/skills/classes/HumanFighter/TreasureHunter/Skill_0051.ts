import { SkillDefinition } from "../../../types";

export const Skill_0051: SkillDefinition = {
  id: 51,
  code: "HF_0051",
  name: "Lure",
  description: "Quietly lures an enemy.\n\nТихо привлекает врага.",
  icon: "/skills/skill0051.gif",
  category: "special",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 10,
  levels: [
    { level: 1, requiredLevel: 52, spCost: 120000, mpCost: 44, power: 500 },
  ],
};

