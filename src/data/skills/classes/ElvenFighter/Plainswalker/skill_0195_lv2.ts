import { SkillDefinition } from "../../../types";

// Acrobatics - continuation (lv.2)
export const skill_0195_lv2: SkillDefinition = {
  id: 195,
  code: "PW_0195",
  name: "Acrobatics",
  description: "Reduces falling damage.\n\nУменьшает урон от падения на 100.",
  icon: "/skills/skill0195.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "fallResist", mode: "flat", value: 100 },
  ],
  levels: [
    { level: 2, requiredLevel: 55, spCost: 160000, mpCost: 0, power: 100 },
  ],
};

