import { SkillDefinition } from "../../../types";

// Focus Mind - continuation from Elven Knight (lv.2-6)
export const skill_0191: SkillDefinition = {
  id: 191,
  code: "TK_0191",
  name: "Focus Mind",
  description: "Increases MP Recovery Speed.\n\nУвеличивает скорость восстановления MP на 1.5-3.1 MP/сек (зависит от уровня).",
  icon: "/skills/skill0191.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "mpRegen", mode: "flat" }, // Value from level.power (MP/sec)
  ],
  levels: [
    { level: 2, requiredLevel: 43, spCost: 40000, mpCost: 0, power: 1.5 },
    { level: 3, requiredLevel: 49, spCost: 82000, mpCost: 0, power: 1.9 },
    { level: 4, requiredLevel: 55, spCost: 180000, mpCost: 0, power: 2.3 },
    { level: 5, requiredLevel: 64, spCost: 370000, mpCost: 0, power: 2.7 },
    { level: 6, requiredLevel: 72, spCost: 1200000, mpCost: 0, power: 3.1 },
  ],
};

