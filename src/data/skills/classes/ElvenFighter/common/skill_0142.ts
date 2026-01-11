import { SkillDefinition } from "../../../types";

// Weapon Mastery - increases attack power
export const skill_0142: SkillDefinition = {
  id: 142,
  code: "ELF_0142",
  name: "Weapon Mastery",
  description: "Attack power increase.\n\nУвеличивает физическую атаку.",
  icon: "/skills/skill0142.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "percent", value: 8.5 }, // 8.5% increase
    { stat: "pAtk", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 5, spCost: 160, mpCost: 0, power: 2 },
    { level: 2, requiredLevel: 10, spCost: 910, mpCost: 0, power: 3 },
    { level: 3, requiredLevel: 15, spCost: 3300, mpCost: 0, power: 4 },
  ],
};

