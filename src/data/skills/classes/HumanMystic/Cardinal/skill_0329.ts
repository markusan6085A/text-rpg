import { SkillDefinition } from "../../../types";

export const skill_0329: SkillDefinition = {
  id: 329,
  code: "HM_0329",
  name: "Health",
  description: "Increases resistance to poison and bleeding.\n\nУвеличивает сопротивление к яду и кровотечению.",
  icon: "/skills/skill0329.gif",
  category: "passive",
  powerType: "percent",
  target: "self",
  scope: "single",
  effects: [
    { stat: "poisonResist", mode: "percent", value: 20 },
    { stat: "bleedResist", mode: "percent", value: 20 },
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

