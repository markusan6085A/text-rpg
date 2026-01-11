import { SkillDefinition } from "../../../types";

export const Skill_0113: SkillDefinition = {
  id: 113,
  code: "HF_0113",
  name: "Long Shot",
  description: "Increase the range of your bow.\n\nУвеличивает дальность стрельбы из лука.",
  icon: "/skills/skill0113.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    {
      "stat": "attackRange",
      "mode": "flat"
    }
  ],
  levels: [
    { level: 2, requiredLevel: 40, spCost: 0, mpCost: 0, power: 400 },
  ],
};

