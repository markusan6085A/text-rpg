import { SkillDefinition } from "../../../types";

export const Skill_0211: SkillDefinition = {
  id: 211,
  code: "WR_0211",
  name: "Boost HP",
  description: "Increases one's maximum HP. -\n\nУвеличивает максимальное HP.",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "maxHp", mode: "flat" }],
  stackType: "boost_hp",
  stackOrder: 1,
  icon: "/skills/0211.jpg",
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3700, mpCost: 0, power: 60 },
    { level: 2, requiredLevel: 28, spCost: 12000, mpCost: 0, power: 100 },
    { level: 3, requiredLevel: 32, spCost: 31000, mpCost: 0, power: 150 },
  ],
};

