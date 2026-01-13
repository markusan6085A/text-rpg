import { SkillDefinition } from "../../../types";

// Health
export const skill_0329: SkillDefinition = {
  id: 329,
  code: "DMSM_0329",
  name: "Health",
  description: "Temporarily increases resistance to Poison and Bleed.\n\nТимчасово збільшує опір до отрути на 20% та до кровотечі на 20%.",
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
      requiredLevel: 77,
      spCost: 12000000,
      mpCost: 0,
      power: 0,
    },
  ],
};

