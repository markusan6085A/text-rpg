import { SkillDefinition } from "../../../types";

// Wisdom - passive skill that increases resistance to Hold, Sleep, and Mental attacks
export const skill_0328: SkillDefinition = {
  id: 328,
  code: "DC_0328",
  name: "Wisdom",
  description: "Increases resistance to Hold, Sleep, and Mental attacks by 20%.\n\nУвеличивает сопротивление к удержанию, сну и ментальным атакам на 20%.",
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
    { level: 1, requiredLevel: 76, spCost: 15000000, mpCost: 0, power: 20 },
  ],
};

