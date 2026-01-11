import { SkillDefinition } from "../../../types";

// Focus Mind для HumanKnight
export const skill_0191: SkillDefinition = {
  id: 191,
  code: "HK_0191",
  name: "Focus Mind",
  description: "Increases MP Recovery Speed.\n\nУвеличивает скорость восстановления MP на 1.1-3.1 (зависит от уровня). Пассивный навык.",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "mpRegen", mode: "flat" }],
  stackType: "focus_mind",
  stackOrder: 1,
  icon: "/skills/skill0191.gif",
  levels: [
    { level: 1, requiredLevel: 36, spCost: 39000, mpCost: 0, power: 1.1 },
  ],
};


