import { SkillDefinition } from "../../../types";

// Shield Mastery для HumanKnight (рівні 1-2)
export const skill_0153: SkillDefinition = {
  id: 153,
  code: "HK_0153",
  name: "Shield Mastery",
  description: "Shield defense increases.\n\nУвеличивает защиту щитом в 1.5-2 раза (зависит от уровня). Пассивный навык. Требуется щит.",
  category: "passive",
  powerType: "multiplier",
  target: "self",
  scope: "single",
  effects: [{ stat: "shieldBlockRate", mode: "multiplier" }],
  stackType: "shield_mastery",
  stackOrder: 1,
  icon: "/skills/skill0153.gif",
  levels: [
    { level: 1, requiredLevel: 20, spCost: 4700, mpCost: 0, power: 1.5 },
    { level: 2, requiredLevel: 28, spCost: 12000, mpCost: 0, power: 1.7 },
  ],
};


