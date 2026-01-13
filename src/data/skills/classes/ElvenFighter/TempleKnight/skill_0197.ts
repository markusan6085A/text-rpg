import { SkillDefinition } from "../../../types";

// Holy Armor - increases resistance to dark magic attacks
export const skill_0197: SkillDefinition = {
  id: 197,
  code: "TK_0197",
  name: "Holy Armor",
  description: "Increases one's resistance to dark magic attacks.\n\nУвеличивает сопротивление к темной магии на 7%.",
  icon: "/skills/skill0197.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "darkResist", mode: "percent", value: 7 },
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 30000, mpCost: 0, power: 7 },
    { level: 2, requiredLevel: 46, spCost: 50000, mpCost: 0, power: 10 },
  ],
};

