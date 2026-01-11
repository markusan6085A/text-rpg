import { SkillDefinition } from "../../../types";

export const Skill_0225: SkillDefinition = {
  id: 225,
  code: "HF_0225",
  name: "Acrobatic Move",
  description: "Dodging abilities increase when running.\n\nУвеличивает способность к уклонению во время бега.",
  icon: "/skills/skill0225.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    {
      stat: "evasion",
      mode: "flat",
    },
  ],
  levels: [
    { level: 2, requiredLevel: 43, spCost: 0, mpCost: 0, power: 5 },
    { level: 3, requiredLevel: 55, spCost: 0, mpCost: 0, power: 6 },
  ],
};

