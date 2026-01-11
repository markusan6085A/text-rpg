import { SkillDefinition } from "../../../types";

export const Skill_0141: SkillDefinition = {
  id: 141,
  code: "HF_0141",
  name: "Armor Mastery",
  description: "Defense increase. -\n\nУвеличивает защиту.",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "pDef", mode: "percent" }],
  stackType: "armor_mastery",
  stackOrder: 1,
  icon: "/skills/0142.jpg",
  levels: [
    { level: 1, requiredLevel: 5, spCost: 160, mpCost: 0, power: 9 },
    { level: 2, requiredLevel: 10, spCost: 550, mpCost: 0, power: 11 },
    { level: 3, requiredLevel: 10, spCost: 1000, mpCost: 0, power: 14 },
    { level: 4, requiredLevel: 15, spCost: 2000, mpCost: 0, power: 17 },
    { level: 5, requiredLevel: 15, spCost: 2500, mpCost: 0, power: 20 },
  ],
};

