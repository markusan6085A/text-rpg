import { SkillDefinition } from "../../../types";

// Acrobatic Move - dodging abilities increase when running
export const skill_0225: SkillDefinition = {
  id: 225,
  code: "AS_0225",
  name: "Acrobatic Move",
  description: "Dodging abilities increase when running.\n\nУвеличивает уклонение при беге на 4.",
  icon: "/skills/skill0225.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "evasion", mode: "flat", value: 4 },
  ],
  levels: [
    { level: 1, requiredLevel: 28, spCost: 8500, mpCost: 0, power: 4 }, // Increases Evasion by 4 when running
  ],
};

