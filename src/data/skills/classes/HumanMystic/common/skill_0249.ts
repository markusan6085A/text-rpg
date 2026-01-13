import { SkillDefinition } from "../../../types";

export const skill_0249: SkillDefinition = {
  id: 249,
  code: "HM_0249",
  name: "Weapon Mastery",
  description: "Increases P. Atk. and M. Atk.\n\nУвеличивает физ. атаку и маг. атаку.",
  icon: "/skills/0141.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "percent" },
    { stat: "mAtk", mode: "percent" },
  ],
  stackType: "weapon_mastery",
  stackOrder: 1,
  levels: [
    { level: 1, requiredLevel: 7, spCost: 470, mpCost: 0, power: 3 },
    { level: 2, requiredLevel: 14, spCost: 2100, mpCost: 0, power: 5 },
  ],
};


