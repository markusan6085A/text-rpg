import { SkillDefinition } from "../../../types";

// Quick Step lv.2 - moving speed increases
export const skill_0169_lv2: SkillDefinition = {
  id: 169,
  code: "SR_0169",
  name: "Quick Step",
  description: "Moving speed increases.\n\nУвеличивает скорость передвижения на 11.",
  icon: "/skills/skill0169.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "runSpeed", mode: "flat", value: 11 },
  ],
  levels: [
    { level: 2, requiredLevel: 43, spCost: 41000, mpCost: 0, power: 11 },
  ],
};

