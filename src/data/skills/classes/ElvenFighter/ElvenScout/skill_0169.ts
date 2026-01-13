import { SkillDefinition } from "../../../types";

// Quick Step - moving speed increases
export const skill_0169: SkillDefinition = {
  id: 169,
  code: "ES_0169",
  name: "Quick Step",
  description: "Moving speed increases.\n\nУвеличивает скорость передвижения на 7.",
  icon: "/skills/skill0169.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "runSpeed", mode: "flat", value: 7 },
  ],
  levels: [
    { level: 1, requiredLevel: 28, spCost: 9200, mpCost: 0, power: 7 },
  ],
};

