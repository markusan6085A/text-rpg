import { SkillDefinition } from "../../../types";

export const Skill_0137: SkillDefinition = {
  id: 137,
  code: "HF_0137",
  name: "Critical Chance",
  description: "Critical rate increases.\n\nУвеличивает шанс критического удара.",
  icon: "/skills/skill0137.gif",
  category: "passive",
  powerType: "percent",
  target: "self",
  scope: "single",
  effects: [
    {
      stat: "critRate",
      mode: "percent",
    },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 31000, mpCost: 0, power: 20 },
  ],
};

