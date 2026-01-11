import { SkillDefinition } from "../../../types";

export const Skill_0210: SkillDefinition = {
  id: 210,
  code: "OM_0210",
  name: "Fist Mastery",
  description: "Increases P. Atk. when using a fist weapon.\n\nУвеличивает физ. атаку при использовании оружия для рукопашного боя.",
  icon: "/skills/skill0210.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pAtk", mode: "flat" },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 5300, mpCost: 0, power: 4.5 },
    { level: 2, requiredLevel: 24, spCost: 10000, mpCost: 0, power: 7.3 },
    { level: 3, requiredLevel: 28, spCost: 8600, mpCost: 0, power: 8.9 },
    { level: 4, requiredLevel: 28, spCost: 8600, mpCost: 0, power: 10.7 },
    { level: 5, requiredLevel: 32, spCost: 14000, mpCost: 0, power: 12.8 },
    { level: 6, requiredLevel: 32, spCost: 14000, mpCost: 0, power: 15.1 },
    { level: 7, requiredLevel: 36, spCost: 19000, mpCost: 0, power: 17.7 },
    { level: 8, requiredLevel: 36, spCost: 19000, mpCost: 0, power: 20.5 },
  ],
};

