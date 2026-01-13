import { SkillDefinition } from "../../../types";

// Holy Armor для Paladin (рівні 1-2)
export const skill_0197: SkillDefinition = {
  id: 197,
  code: "PAL_0197",
  name: "Holy Armor",
  description: "Increases one's resistance to dark magic attacks.\n\nУвеличивает сопротивление к темной магии на 7-10% (зависит от уровня). Пассивный навык.",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  icon: "/skills/skill0197.gif",
  effects: [
    { stat: "darkResist", mode: "percent", value: 7 },
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 35000, mpCost: 0, power: 7 },
    { level: 2, requiredLevel: 46, spCost: 55000, mpCost: 0, power: 10 },
  ],
};

