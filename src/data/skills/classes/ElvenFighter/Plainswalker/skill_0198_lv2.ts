import { SkillDefinition } from "../../../types";

// Boost Evasion - continuation (lv.2-3)
export const skill_0198_lv2: SkillDefinition = {
  id: 198,
  code: "PW_0198",
  name: "Boost Evasion",
  description: "Increase evasion.\n\nУвеличивает Evasion на 3-4 (зависит от уровня).",
  icon: "/skills/skill0198.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    { stat: "evasion", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 2, requiredLevel: 46, spCost: 43000, mpCost: 0, power: 3 },
    { level: 3, requiredLevel: 58, spCost: 200000, mpCost: 0, power: 4 },
  ],
};

