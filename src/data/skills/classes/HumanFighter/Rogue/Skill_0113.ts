import { SkillDefinition } from "../../../types";

export const Skill_0113: SkillDefinition = {
  id: 113,
  code: "HF_0113",
  name: "Long Shot",
  description: "Increase the range of your bow.\n\nУвеличивает дальность вашего лука.",
  icon: "/skills/skill0113.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  levels: [
  {
    "level": 1,
    "requiredLevel": 20,
    "spCost": 3400,
    "mpCost": 0,
    "power": 0
  },
  {
    "level": 2,
    "requiredLevel": 24,
    "spCost": 0,
    "mpCost": 0,
    "power": 0
  }
]
};
