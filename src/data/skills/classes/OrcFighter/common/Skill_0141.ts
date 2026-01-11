import { SkillDefinition } from "../../../types";

export const Skill_0141: SkillDefinition = {
  id: 141,
  code: "OF_0141",
  name: "Weapon Mastery",
  description: "Attack power increase.\n\nУвеличивает физ. атаку на 2/3/4.\nУвеличивает физ. атаку на 8.5%.",
  icon: "/skills/skill0141.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "multiplier", multiplier: 1.085 },
    { stat: "pAtk", mode: "flat" },
  ],
  levels: [
    { level: 1, requiredLevel: 5, spCost: 190, mpCost: 0, power: 2 },
    { level: 2, requiredLevel: 10, spCost: 1300, mpCost: 0, power: 3 },
    { level: 3, requiredLevel: 15, spCost: 4000, mpCost: 0, power: 4 },
  ],
};

