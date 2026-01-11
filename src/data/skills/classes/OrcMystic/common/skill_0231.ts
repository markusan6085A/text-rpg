import { SkillDefinition } from "../../../types";

// Heavy Armor Mastery - passive skill that increases P. Def., Casting Spd., and Atk. Spd. when wearing heavy armor
export const skill_0231: SkillDefinition = {
  id: 231,
  code: "OM_0231",
  name: "Heavy Armor Mastery",
  description: "Increases P. Def., Casting Spd., and Atk. Spd. when wearing heavy armor.\n\nУвеличивает физическую защиту, скорость каста и скорость атаки при ношении тяжелой брони.",
  icon: "/skills/Skill0231_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "pDef", mode: "flat" },
    { stat: "castSpeed", mode: "percent", value: 71 },
    { stat: "atkSpeed", mode: "percent", value: 25 },
  ],
  levels: [
    { level: 1, requiredLevel: 14, spCost: 880, mpCost: 0, power: 11.6 },
    { level: 2, requiredLevel: 14, spCost: 880, mpCost: 0, power: 13.3 },
  ],
};

