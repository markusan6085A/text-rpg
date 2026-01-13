import { SkillDefinition } from "../../../types";

export const skill_0213: SkillDefinition = {
  id: 213,
  code: "HM_0213",
  name: " MP",
  description: "Описание умения.",
  icon: "/skills/skill0213.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "maxMp", mode: "flat" }],
  stackType: "boost_mana",
  stackOrder: 1,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 0, power: 30 },
    { level: 2, requiredLevel: 30, spCost: 13000, mpCost: 0, power: 50 },
  ],
};

