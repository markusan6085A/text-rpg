import { SkillDefinition } from "../../../types";

// Shield Mastery - continuation from Elven Knight (lv.3-4)
export const skill_0153: SkillDefinition = {
  id: 153,
  code: "TK_0153",
  name: "Shield Mastery",
  description: "Shield defense increases.\n\nУвеличивает защиту щитом на 85-100% (зависит от уровня).",
  icon: "/skills/skill0153.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "shieldDef", mode: "percent" }, // Value from level.power
  ],
  levels: [
    { level: 3, requiredLevel: 40, spCost: 30000, mpCost: 0, power: 85 },
    { level: 4, requiredLevel: 52, spCost: 120000, mpCost: 0, power: 100 },
  ],
};

