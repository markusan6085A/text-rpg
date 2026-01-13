import { SkillDefinition } from "../../../types";

// Shadow Sense - increases Accuracy at night
export const skill_0294: SkillDefinition = {
  id: 294,
  code: "DKF_0294",
  name: "Shadow Sense",
  description: "Increases Accuracy at night.\n\nУвеличивает точность ночью.",
  icon: "/skills/skill0294.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "accuracy", mode: "flat", value: 3 },
  ],
  levels: [
    { level: 1, requiredLevel: 15, spCost: 2900, mpCost: 0, power: 0 },
  ],
};

