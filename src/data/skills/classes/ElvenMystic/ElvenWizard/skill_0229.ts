import { SkillDefinition } from "../../../types";

// Fast Mana Recovery - increases MP Recovery Speed
export const skill_0229: SkillDefinition = {
  id: 229,
  code: "EW_0229",
  name: "Fast Mana Recovery",
  description: "Increases MP Recovery Speed.\n\nУскоряет регенерацию MP на 1.1-1.5 MP/сек (зависит от уровня).",
  icon: "/skills/skill0229.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "mpRegen", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 25, spCost: 6100, mpCost: 0, power: 1.1 },
    { level: 2, requiredLevel: 35, spCost: 21000, mpCost: 0, power: 1.5 },
  ],
};

