import { SkillDefinition } from "../../../types";

// Dagger Mastery - increases P. Atk when using a dagger
export const skill_0209: SkillDefinition = {
  id: 209,
  code: "AS_0209",
  name: "Dagger Mastery",
  description: "Increases P. Atk. when using a dagger.\n\nУвеличивает физическую атаку при использовании кинжала.",
  icon: "/skills/skill0209.gif",
  category: "passive",
  powerType: "percent",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "percent" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2800, mpCost: 0, power: 3.6 },
    { level: 2, requiredLevel: 24, spCost: 5000, mpCost: 0, power: 6 },
    { level: 3, requiredLevel: 28, spCost: 4300, mpCost: 0, power: 7.4 },
    { level: 4, requiredLevel: 28, spCost: 4300, mpCost: 0, power: 9 },
    { level: 5, requiredLevel: 32, spCost: 7100, mpCost: 0, power: 10.8 },
    { level: 6, requiredLevel: 32, spCost: 7100, mpCost: 0, power: 12.8 },
    { level: 7, requiredLevel: 36, spCost: 11000, mpCost: 0, power: 15.1 },
    { level: 8, requiredLevel: 36, spCost: 11000, mpCost: 0, power: 17.6 },
  ],
};

