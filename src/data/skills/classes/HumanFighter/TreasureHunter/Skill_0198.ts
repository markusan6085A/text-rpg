import { SkillDefinition } from "../../../types";

export const Skill_0198: SkillDefinition = {
  id: 198,
  code: "HF_0198",
  name: "Boost Evasion",
  description: "Increase evasion.\n\nУвеличивает уклонение.",
  icon: "/skills/skill0198.gif",
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
    { level: 2, requiredLevel: 46, spCost: 47000, mpCost: 0, power: 3 },
    { level: 3, requiredLevel: 58, spCost: 0, mpCost: 0, power: 4 },
  ],
};

