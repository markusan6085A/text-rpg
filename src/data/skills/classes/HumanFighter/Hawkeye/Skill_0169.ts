import { SkillDefinition } from "../../../types";

export const Skill_0169: SkillDefinition = {
  id: 169,
  code: "HF_0169",
  name: "Quick Step",
  description: "Moving speed increases.\n\nУвеличивает скорость передвижения.",
  icon: "/skills/skill0169.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    {
      "stat": "runSpeed",
      "mode": "flat"
    }
  ],
  levels: [
    { level: 2, requiredLevel: 40, spCost: 0, mpCost: 0, power: 11 },
  ],
};

