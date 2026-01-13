import { SkillDefinition } from "../../../types";

// Fast Mana Recovery - passive skill that increases MP regeneration
export const skill_0229: SkillDefinition = {
  id: 229,
  code: "OS_0229",
  name: "Fast Mana Recovery",
  description: "Increases MP Recovery Speed.\n\nУвеличивает скорость регенерации MP.",
  icon: "/skills/Skill0229_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "mpRegen", mode: "flat" },
  ],
  levels: [
    { level: 1, requiredLevel: 25, spCost: 5800, mpCost: 0, power: 1.1 },
    { level: 2, requiredLevel: 35, spCost: 18000, mpCost: 0, power: 1.5 },
  ],
};

