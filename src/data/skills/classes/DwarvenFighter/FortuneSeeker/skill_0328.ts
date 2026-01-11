import { SkillDefinition } from "../../../types";

// Wisdom - increases resistance to Hold, Sleep, and Mental attacks
// XML: mul rootVuln 0.8, mul sleepVuln 0.8, mul derangementVuln 0.8 (20% resistance)
export const skill_0328: SkillDefinition = {
  id: 328,
  code: "FS_0328",
  name: "Wisdom",
  description: "Increases resistance to Hold, Sleep, and Mental attacks.\n\nУвеличивает сопротивление к удержанию, сну и ментальным атакам на 20%.",
  icon: "/skills/skill0328.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "holdResist", mode: "percent", value: 20 },
    { stat: "sleepResist", mode: "percent", value: 20 },
    { stat: "mentalResist", mode: "percent", value: 20 },
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 10000000, mpCost: 0, power: 0 },
  ],
};

