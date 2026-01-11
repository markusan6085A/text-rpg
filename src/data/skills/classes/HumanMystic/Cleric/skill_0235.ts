import { SkillDefinition } from "../../../types";

export const skill_0235: SkillDefinition = {
  id: 235,
  code: "HM_0235",
  name: "Robe Mastery",
  description: "Increases P. Def. when wearing a robe.\n\nУвеличивает физ. защиту при ношении мантии.",
  icon: "/skills/skill0235.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "pDef", mode: "flat" }],
  stackType: "robe_mastery",
  stackOrder: 1,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 1600, mpCost: 0, power: 7.2 },
    { level: 2, requiredLevel: 20, spCost: 1600, mpCost: 0, power: 8.6 },
    { level: 3, requiredLevel: 25, spCost: 3400, mpCost: 0, power: 11 },
    { level: 4, requiredLevel: 25, spCost: 3400, mpCost: 0, power: 12.7 },
    { level: 5, requiredLevel: 30, spCost: 6600, mpCost: 0, power: 15.4 },
    { level: 6, requiredLevel: 30, spCost: 6600, mpCost: 0, power: 17.4 },
    { level: 7, requiredLevel: 35, spCost: 11000, mpCost: 0, power: 20.5 },
    { level: 8, requiredLevel: 35, spCost: 11000, mpCost: 0, power: 22.7 },
  ],
};

