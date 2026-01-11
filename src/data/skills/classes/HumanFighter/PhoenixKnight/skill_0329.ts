import { SkillDefinition } from "../../../types";

// Health для PhoenixKnight (рівень 1)
export const skill_0329: SkillDefinition = {
  id: 329,
  code: "PKN_0329",
  name: "Health",
  description: "Temporarily increases resistance to Poison and Bleed.\n\nВременно увеличивает сопротивление к яду и кровотечению на 20%.",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  icon: "/skills/skill0329.gif",
  effects: [
    { stat: "poisonResist", mode: "percent", value: 20 }, // Зменшує вразливість до Poison на 20%
    { stat: "bleedResist", mode: "percent", value: 20 }, // Зменшує вразливість до Bleed на 20%
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 10000000, mpCost: 0, power: 0 },
  ],
};

