import { SkillDefinition } from "../../../types";

// Long Shot - increases bow range (continuation from Assassin lv.2)
export const skill_0113: SkillDefinition = {
  id: 113,
  code: "PR_0113",
  name: "Long Shot",
  description: "Increase the range of your bow.\n\nУвеличивает дальность лука на 400.",
  icon: "/skills/skill0113.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "attackRange", mode: "flat", value: 400 },
  ],
  levels: [
    { level: 2, requiredLevel: 40, spCost: 33000, mpCost: 0, power: 400 }, // Increases bow range by 400
  ],
};

