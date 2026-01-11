import { SkillDefinition } from "../../../types";

export const Skill_0319: SkillDefinition = {
  id: 319,
  code: "TY_0319",
  name: "Agile Movement",
  description: "Increases Accuracy and Speed while wearing light armor.\n\nУвеличивает точность и скорость при ношении легкой брони.",
  icon: "/skills/skill0319.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "runSpeed", mode: "flat", value: 10 },
    { stat: "accuracy", mode: "flat", value: 3 },
  ],
  levels: [
    { level: 2, requiredLevel: 40, spCost: 0, mpCost: 0, power: 0 },
  ],
};

