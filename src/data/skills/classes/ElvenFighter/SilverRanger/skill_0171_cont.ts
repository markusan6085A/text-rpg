import { SkillDefinition } from "../../../types";

// Esprit - continuation from Elven Scout (lv.2-8)
// Note: HP and MP regen values are fixed per level, but SkillDefinition doesn't support per-level effects
// The power field represents HP regen, MP regen is calculated: 0.9 + (level - 2) * 0.1
export const skill_0171_cont: SkillDefinition = {
  id: 171,
  code: "SR_0171",
  name: "Esprit",
  description: "Increases recovery speed while one is running.\n\nУвеличивает скорость восстановления HP при беге на 3-6 HP/сек (зависит от уровня).\nУвеличивает скорость восстановления MP при беге на 0.9-1.5 MP/сек (зависит от уровня).",
  icon: "/skills/skill0171.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "hpRegen", mode: "flat", value: 3 }, // Base HP regen, increases with level
    { stat: "mpRegen", mode: "flat", value: 0.9 }, // Base MP regen, increases with level
  ],
  levels: [
    { level: 2, requiredLevel: 43, spCost: 41000, mpCost: 0, power: 3 }, // 3 HP/sec, 0.9 MP/sec
    { level: 3, requiredLevel: 46, spCost: 50000, mpCost: 0, power: 3.5 }, // 3.5 HP/sec, 1 MP/sec
    { level: 4, requiredLevel: 49, spCost: 89000, mpCost: 0, power: 4 }, // 4 HP/sec, 1.1 MP/sec
    { level: 5, requiredLevel: 52, spCost: 140000, mpCost: 0, power: 4.5 }, // 4.5 HP/sec, 1.2 MP/sec
    { level: 6, requiredLevel: 62, spCost: 360000, mpCost: 0, power: 5 }, // 5 HP/sec, 1.3 MP/sec
    { level: 7, requiredLevel: 68, spCost: 780000, mpCost: 0, power: 5.5 }, // 5.5 HP/sec, 1.4 MP/sec
    { level: 8, requiredLevel: 74, spCost: 2300000, mpCost: 0, power: 6 }, // 6 HP/sec, 1.5 MP/sec
  ],
};

