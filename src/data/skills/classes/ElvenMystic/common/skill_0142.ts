import { SkillDefinition } from "../../../types";

// Weapon Mastery - increases P. Atk. and M. Atk.
export const skill_0142: SkillDefinition = {
  id: 142,
  code: "EM_0142",
  name: "Weapon Mastery",
  description: "Increases P. Atk. and M. Atk.\n\nУвеличивает физическую атаку на 1.5-2.8 (зависит от уровня).\nУвеличивает магическую атаку на 1.9-3.5 (зависит от уровня).\nУвеличивает физическую атаку на 45%.\nУвеличивает магическую атаку на 17%.",
  icon: "/skills/skill0142.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "flat" }, // Value from level.power (1.5, 2.8)
    { stat: "mAtk", mode: "flat" }, // Value from level.power (1.9, 3.5)
    { stat: "pAtk", mode: "percent", value: 45 },
    { stat: "mAtk", mode: "percent", value: 17 },
  ],
  levels: [
    { level: 1, requiredLevel: 7, spCost: 520, mpCost: 0, power: 1.5 },
    { level: 2, requiredLevel: 14, spCost: 2100, mpCost: 0, power: 2.8 },
  ],
};

