import { SkillDefinition } from "../../../types";

// Fast HP Recovery - increases HP recovery speed
export const skill_0249: SkillDefinition = {
  id: 249,
  code: "EW_0249",
  name: "Fast HP Recovery",
  description: "Increases HP recovery speed.\n\nУскоряет регенерацию HP на 1.1 HP/сек.",
  icon: "/skills/skill0249.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "hpRegen", mode: "flat", value: 1.1 },
  ],
  levels: [
    { level: 1, requiredLevel: 35, spCost: 21000, mpCost: 0, power: 1.1 },
  ],
};

