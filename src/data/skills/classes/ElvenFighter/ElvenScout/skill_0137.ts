import { SkillDefinition } from "../../../types";

// Critical Chance - critical rate increases
export const skill_0137: SkillDefinition = {
  id: 137,
  code: "ES_0137",
  name: "Critical Chance",
  description: "Critical rate increases.\n\nУвеличивает шанс критической атаки на 20%.",
  icon: "/skills/skill0137.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "critRate", mode: "percent", value: 20 },
  ],
  levels: [
    { level: 1, requiredLevel: 32, spCost: 15000, mpCost: 0, power: 20 },
  ],
};

