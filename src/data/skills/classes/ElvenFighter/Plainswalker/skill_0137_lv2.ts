import { SkillDefinition } from "../../../types";

// Critical Chance - continuation (lv.2-3)
export const skill_0137_lv2: SkillDefinition = {
  id: 137,
  code: "PW_0137",
  name: "Critical Chance",
  description: "Critical rate increases.\n\nУвеличивает шанс критической атаки на 30%-40% (зависит от уровня).",
  icon: "/skills/skill0137.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "critRate", mode: "percent" }, // Value from level.power
  ],
  levels: [
    { level: 2, requiredLevel: 40, spCost: 28000, mpCost: 0, power: 30 },
    { level: 3, requiredLevel: 49, spCost: 75000, mpCost: 0, power: 40 },
  ],
};

