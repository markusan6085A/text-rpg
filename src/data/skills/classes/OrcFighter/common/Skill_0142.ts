import { SkillDefinition } from "../../../types";

export const Skill_0142: SkillDefinition = {
  id: 142,
  code: "OF_0142",
  name: "Armor Mastery",
  description: "Defense increase.\n\nУвеличивает защиту.",
  icon: "/skills/skill0142.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat" },
    // Evasion: 0 for levels 1-3, 3 for levels 4-5
    { stat: "evasion", mode: "flat", value: 0 },
  ],
  levels: [
    { level: 1, requiredLevel: 5, spCost: 190, mpCost: 0, power: 9 },
    { level: 2, requiredLevel: 10, spCost: 690, mpCost: 0, power: 11 },
    { level: 3, requiredLevel: 10, spCost: 690, mpCost: 0, power: 12 },
    { level: 4, requiredLevel: 15, spCost: 2000, mpCost: 0, power: 13 },
    { level: 5, requiredLevel: 15, spCost: 2000, mpCost: 0, power: 14 },
  ],
};

