import { SkillDefinition } from "../../../types";

export const Skill_0142: SkillDefinition = {
  id: 142,
  code: "HF_0142",
  name: "Weapon Mastery",
  description: "Increases P. Atk. and M. Atk. -\n\nУвеличивает физ. атаку и маг. атаку.",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "percent" },
    { stat: "mAtk", mode: "percent" },
  ],
  stackType: "weapon_mastery",
  stackOrder: 1,
  icon: "/skills/0141.jpg",
  levels: [
    { level: 1, requiredLevel: 5, spCost: 160, mpCost: 0, power: 2 },
    { level: 2, requiredLevel: 10, spCost: 550, mpCost: 0, power: 3 },
    { level: 3, requiredLevel: 15, spCost: 2000, mpCost: 0, power: 4 },
  ],
};

