import { SkillDefinition } from "../../../types";

// Remedy для Paladin (рівні 1-3)
export const skill_0044: SkillDefinition = {
  id: 44,
  code: "PAL_0044",
  name: "Remedy",
  description: "Stops user's bleeding.\n\nОстанавливает кровотечение. Эффект: 3-9 (зависит от уровня). Каст: 4 сек. Перезарядка: 6 сек.",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  icon: "/skills/skill0044.gif",
  effects: [
    { stat: "bleedResist", mode: "flat", value: 3 },
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 35000, mpCost: 35, power: 3 },
    { level: 2, requiredLevel: 49, spCost: 82000, mpCost: 44, power: 7 },
    { level: 3, requiredLevel: 62, spCost: 330000, mpCost: 55, power: 9 },
  ],
};

