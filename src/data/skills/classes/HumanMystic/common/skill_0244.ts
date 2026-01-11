import { SkillDefinition } from "../../../types";

export const skill_0244: SkillDefinition = {
  id: 244,
  code: "HM_0244",
  name: "Armor Mastery",
  description: "Defense increase.\n\nУвеличивает защиту на 8-12% (зависит от уровня). Пассивный навык.",
  icon: "/skills/0142.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "pDef", mode: "percent" }],
  levels: [
    { level: 1, requiredLevel: 7, spCost: 470, mpCost: 0, power: 8 },
    { level: 2, requiredLevel: 14, spCost: 1100, mpCost: 0, power: 10 },
    { level: 3, requiredLevel: 14, spCost: 1100, mpCost: 0, power: 12 },
  ],
};


