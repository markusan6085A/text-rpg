import { SkillDefinition } from "../../../types";

// Quick Step - moving speed increases (continuation from Assassin lv.2)
export const skill_0169: SkillDefinition = {
  id: 169,
  code: "PR_0169",
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
    { level: 2, requiredLevel: 43, spCost: 33000, mpCost: 0, power: 11 }, // Increases moving speed by 11
  ],
};

