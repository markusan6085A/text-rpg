import { SkillDefinition } from "../../../types";

// Boost HP - 3 levels
// XML: #hp: 60 100 150
export const skill_0211: SkillDefinition = {
  id: 211,
  code: "SC_0211",
  name: "Boost HP",
  description: "Increases maximum HP.\n\nУвеличивает максимальное HP.",
  icon: "/skills/skill0211.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "maxHp", mode: "flat" }], // Value from level.power
  levels: [
    { level: 1, requiredLevel: 20, spCost: 4100, mpCost: 0, power: 60 },
    { level: 2, requiredLevel: 28, spCost: 13000, mpCost: 0, power: 100 },
    { level: 3, requiredLevel: 36, spCost: 35000, mpCost: 0, power: 150 },
  ],
};

