import { SkillDefinition } from "../../../types";

// Wisdom - increases resistance to Hold, Sleep, and Mental attacks
// XML: rootVuln: 0.8, sleepVuln: 0.8, derangementVuln: 0.8 (20% resistance)
export const skill_0328: SkillDefinition = {
  id: 328,
  code: "MA_0328",
  name: "Wisdom",
  description: "Increases resistance to Hold, Sleep, and Mental attacks.\n\nУвеличивает сопротивление к удержанию, сну и ментальным атакам на 20%.",
  icon: "/skills/skill0328.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "holdResist", mode: "multiplier", multiplier: 0.8 }, // 20% resistance = 0.8 vulnerability
    { stat: "sleepResist", mode: "multiplier", multiplier: 0.8 }, // 20% resistance = 0.8 vulnerability
    { stat: "mentalResist", mode: "multiplier", multiplier: 0.8 }, // 20% resistance = 0.8 vulnerability
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 15000000, mpCost: 0, power: 0 },
  ],
};

