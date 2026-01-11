import { SkillDefinition } from "../../../types";

// Health - пасивний скіл, що збільшує стійкість до отрути та кровотечі
export const skill_0329: SkillDefinition = {
  id: 329,
  code: "ES_0329",
  name: "Health",
  description: "Temporarily increases resistance to Poison and Bleed.\n\nВременно увеличивает сопротивление к яду на 20%.\nВременно увеличивает сопротивление к кровотечению на 20%.",
  icon: "/skills/skill0329.gif",
  category: "passive",
  type: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "poisonResist", mode: "percent", value: 20 },
    { stat: "bleedResist", mode: "percent", value: 20 },
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 10000000, mpCost: 0, power: 0 },
  ],
};

