import { SkillDefinition } from "../../../types";

// Long Shot lv.2 - increases bow range
export const skill_0113_lv2: SkillDefinition = {
  id: 113,
  code: "SR_0113",
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
    { level: 2, requiredLevel: 40, spCost: 35000, mpCost: 0, power: 400 },
  ],
};

