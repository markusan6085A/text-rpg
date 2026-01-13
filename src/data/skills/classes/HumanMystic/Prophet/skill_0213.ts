import { SkillDefinition } from "../../../types";

export const skill_0213: SkillDefinition = {
  id: 213,
  code: "HM_0213",
  name: "Boost Mana",
  description: "Enhances the caster's maximum MP pool.\n\nУвеличивает максимальный запас MP.",
  icon: "/skills/skill0213.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    {
      stat: "maxMp",
      mode: "flat",
    },
  ],
  stackType: "boost_mana",
  stackOrder: 1,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 0, power: 30 },
    { level: 2, requiredLevel: 30, spCost: 13000, mpCost: 0, power: 50 },
    { level: 3, requiredLevel: 40, spCost: 31000, mpCost: 0, power: 70 },
    { level: 4, requiredLevel: 48, spCost: 63000, mpCost: 0, power: 100 },
    { level: 5, requiredLevel: 56, spCost: 110000, mpCost: 0, power: 140 },
    { level: 6, requiredLevel: 60, spCost: 270000, mpCost: 0, power: 152 },
    { level: 7, requiredLevel: 66, spCost: 700000, mpCost: 0, power: 180 },
    { level: 8, requiredLevel: 72, spCost: 1700000, mpCost: 0, power: 200 },
  ],
};


