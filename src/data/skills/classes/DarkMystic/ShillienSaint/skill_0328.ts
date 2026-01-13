import { SkillDefinition } from "../../../types";

// Wisdom
export const skill_0328: SkillDefinition = {
  id: 328,
  code: "DMS_0328",
  name: "Wisdom",
  description: "Increases resistance to Hold, Sleep, and Mental attacks.\n\nУвеличивает сопротивление к удержанию, сну и ментальным атакам на 20%.",
  icon: "/skills/skill0328.gif",
  category: "passive",
  powerType: "percent",
  target: "self",
  scope: "single",
  effects: [
    { stat: "holdResist", mode: "percent", value: 20 }, // rootVuln 0.8 = -20% vulnerability = +20% resist
    { stat: "sleepResist", mode: "percent", value: 20 }, // sleepVuln 0.8
    { stat: "mentalResist", mode: "percent", value: 20 }, // derangementVuln 0.8
  ],
  levels: [
    {
      level: 1,
      requiredLevel: 76,
      spCost: 10000000,
      mpCost: 0,
      power: 0,
    },
  ],
};

