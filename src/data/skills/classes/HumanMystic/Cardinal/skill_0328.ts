import { SkillDefinition } from "../../../types";

export const skill_0328: SkillDefinition = {
  id: 328,
  code: "HM_0328",
  name: "Wisdom",
  description: "Increases resistance to Hold, Sleep, and Mental attacks. -",
  icon: "/skills/skill0328.gif",
  category: "passive",
  powerType: "percent",
  target: "self",
  scope: "single",
  effects: [
    { stat: "holdResist", mode: "percent", value: 20 },
    { stat: "sleepResist", mode: "percent", value: 20 },
    { stat: "mentalResist", mode: "percent", value: 20 },
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

