import { SkillDefinition } from "../../../types";

// Acrobatic Move - dodging abilities increase when running (continuation from Assassin lv.2-3)
export const skill_0225: SkillDefinition = {
  id: 225,
  code: "PR_0225",
  name: "Acrobatic Move",
  description: "Dodging abilities increase when running.\n\nУвеличивает уклонение при беге.",
  icon: "/skills/skill0225.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "evasion", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 2, requiredLevel: 43, spCost: 33000, mpCost: 0, power: 5 }, // Increases Evasion by 5 when running
    { level: 3, requiredLevel: 55, spCost: 170000, mpCost: 0, power: 6 }, // Increases Evasion by 6 when running
  ],
};

