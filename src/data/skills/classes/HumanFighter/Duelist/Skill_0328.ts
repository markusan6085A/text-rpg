import { SkillDefinition } from "../../../types";

export const Skill_0328: SkillDefinition = {
  id: 328,
  code: "DL_0328",
  name: "Wisdom",
  description: "Increases resistance to Hold, Sleep, and Mental attacks. -\n\nУвеличивает сопротивление к удержанию, сну и ментальным атакам.",
  category: "passive",
  powerType: "none",
  icon: "/skills/skill0328.gif",
  effects: [
    { stat: "holdResist", mode: "percent", value: 20 },
    { stat: "sleepResist", mode: "percent", value: 20 },
    { stat: "mentalResist", mode: "percent", value: 20 },
  ],
  levels: [{ level: 1, requiredLevel: 76, spCost: 10000000, mpCost: 0, power: 0 }],
};

