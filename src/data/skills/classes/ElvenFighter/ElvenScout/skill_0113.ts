import { SkillDefinition } from "../../../types";

// Long Shot - increases bow range
export const skill_0113: SkillDefinition = {
  id: 113,
  code: "ES_0113",
  name: "Long Shot",
  description: "Increase the range of your bow.\n\nУвеличивает дальность лука на 200.",
  icon: "/skills/skill0113.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "attackRange", mode: "flat", value: 200 },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2800, mpCost: 0, power: 200 },
  ],
};

