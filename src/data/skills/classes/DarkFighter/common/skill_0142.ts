import { SkillDefinition } from "../../../types";

// Armor Mastery - increases defense
export const skill_0142: SkillDefinition = {
  id: 142,
  code: "DKF_0142",
  name: "Armor Mastery",
  description: "Increases defense when wearing heavy equipment. Increases defense and evasion when wearing light equipment.\n\nУвеличивает защиту при ношении тяжелой брони. Увеличивает защиту и уклонение при ношении легкой брони.",
  icon: "/skills/skill0142.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat" }, // Value from level.power
    // For light armor: also increases evasion
    { stat: "evasion", mode: "flat", value: 3 }, // Only for light armor (handled in applyPassiveSkills)
  ],
  levels: [
    { level: 1, requiredLevel: 5, spCost: 160, mpCost: 0, power: 9 },
    { level: 2, requiredLevel: 10, spCost: 460, mpCost: 0, power: 11 },
    { level: 3, requiredLevel: 10, spCost: 460, mpCost: 0, power: 12 },
    { level: 4, requiredLevel: 15, spCost: 1400, mpCost: 0, power: 13 },
    { level: 5, requiredLevel: 15, spCost: 1400, mpCost: 0, power: 14 },
  ],
};

