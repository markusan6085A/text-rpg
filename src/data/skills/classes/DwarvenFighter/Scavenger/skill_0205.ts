import { SkillDefinition } from "../../../types";

// Blunt Mastery - 8 levels
// XML: #pAtk: 4.5 7.3 8.9 10.7 12.8 15.1 17.7 20.5
export const skill_0205: SkillDefinition = {
  id: 205,
  code: "SC_0205",
  name: "Blunt Mastery",
  description: "Increases P. Atk. when a blunt weapon is used.\n\nУвеличивает физическую атаку при использовании тупого оружия.",
  icon: "/skills/skill0205.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "pAtk", mode: "flat" }], // Value from level.power
  levels: [
    { level: 1, requiredLevel: 20, spCost: 4100, mpCost: 0, power: 4.5 },
    { level: 2, requiredLevel: 24, spCost: 7700, mpCost: 0, power: 7.3 },
    { level: 3, requiredLevel: 28, spCost: 6700, mpCost: 0, power: 8.9 },
    { level: 4, requiredLevel: 28, spCost: 6700, mpCost: 0, power: 10.7 },
    { level: 5, requiredLevel: 32, spCost: 13000, mpCost: 0, power: 12.8 },
    { level: 6, requiredLevel: 32, spCost: 13000, mpCost: 0, power: 15.1 },
    { level: 7, requiredLevel: 36, spCost: 17000, mpCost: 0, power: 17.7 },
    { level: 8, requiredLevel: 36, spCost: 17000, mpCost: 0, power: 20.5 },
  ],
};

