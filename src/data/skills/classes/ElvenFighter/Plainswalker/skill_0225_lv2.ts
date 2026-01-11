import { SkillDefinition } from "../../../types";

// Acrobatic Move - continuation (lv.2-3)
export const skill_0225_lv2: SkillDefinition = {
  id: 225,
  code: "PW_0225",
  name: "Acrobatic Move",
  description: "Dodging abilities increase when running.\n\nУвеличивает Evasion при беге на 5-6 (зависит от уровня).",
  icon: "/skills/skill0225.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    { stat: "evasion", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 2, requiredLevel: 43, spCost: 35000, mpCost: 0, power: 5 },
    { level: 3, requiredLevel: 55, spCost: 160000, mpCost: 0, power: 6 },
  ],
};

