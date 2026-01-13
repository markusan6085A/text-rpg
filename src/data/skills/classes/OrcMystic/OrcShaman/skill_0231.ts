import { SkillDefinition } from "../../../types";

// Heavy Armor Mastery - passive skill (Levels 3-10 for OrcShaman)
export const skill_0231: SkillDefinition = {
  id: 231,
  code: "OS_0231",
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
    { level: 3, requiredLevel: 20, spCost: 1400, mpCost: 0, power: 15.2 },
    { level: 4, requiredLevel: 20, spCost: 1400, mpCost: 0, power: 17.2 },
    { level: 5, requiredLevel: 25, spCost: 2900, mpCost: 0, power: 19.5 },
    { level: 6, requiredLevel: 25, spCost: 2900, mpCost: 0, power: 21.1 },
    { level: 7, requiredLevel: 30, spCost: 5300, mpCost: 0, power: 23.7 },
    { level: 8, requiredLevel: 30, spCost: 5300, mpCost: 0, power: 25.6 },
    { level: 9, requiredLevel: 35, spCost: 8800, mpCost: 0, power: 28.7 },
    { level: 10, requiredLevel: 35, spCost: 8800, mpCost: 0, power: 30.8 },
  ],
};

