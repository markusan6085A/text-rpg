import { SkillDefinition } from "../../../types";

// Focus Mind - increases MP Recovery Speed
export const skill_0191: SkillDefinition = {
  id: 191,
  code: "EK_0191",
  name: "Focus Mind",
  description: "Increases MP Recovery Speed.\n\nУвеличивает скорость восстановления MP на 1.1 MP/сек.",
  icon: "/skills/skill0191.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "mpRegen", mode: "flat", value: 1.1 }, // 1.1 MP/sec
  ],
  levels: [
    { level: 1, requiredLevel: 36, spCost: 39000, mpCost: 0, power: 0 },
  ],
};

