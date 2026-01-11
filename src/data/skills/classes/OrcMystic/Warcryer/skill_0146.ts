import { SkillDefinition } from "../../../types";

// Anti Magic - passive skill that increases M. Def. (Levels 13-45 for Warcryer)
// Data from Warcryer.txt and XML files
// mDef values from XML table (indices 12-44): 40 42 43 46 47 49 52 54 56 59 61 63 66 68 70 72 74 76 78 80 82 84 86 88 91 93 95 97 99 102 104 106 108
export const skill_0146: SkillDefinition = {
  id: 146,
  code: "WC_0146",
  name: "Anti Magic",
  description: "Increases M. Def.\n\nУвеличивает магическую защиту.",
  icon: "/skills/Skill0146_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    { stat: "mDef", mode: "flat" },
  ],
  stackType: "anti_magic",
  stackOrder: 1,
  levels: [
    // Level 40
    { level: 13, requiredLevel: 40, spCost: 9000, mpCost: 0, power: 40 },
    { level: 14, requiredLevel: 40, spCost: 9000, mpCost: 0, power: 42 },
    { level: 15, requiredLevel: 40, spCost: 9000, mpCost: 0, power: 43 },
    // Level 44
    { level: 16, requiredLevel: 44, spCost: 12000, mpCost: 0, power: 46 },
    { level: 17, requiredLevel: 44, spCost: 12000, mpCost: 0, power: 47 },
    { level: 18, requiredLevel: 44, spCost: 12000, mpCost: 0, power: 49 },
    // Level 48
    { level: 19, requiredLevel: 48, spCost: 21000, mpCost: 0, power: 52 },
    { level: 20, requiredLevel: 48, spCost: 21000, mpCost: 0, power: 54 },
    { level: 21, requiredLevel: 48, spCost: 21000, mpCost: 0, power: 56 },
    // Level 52
    { level: 22, requiredLevel: 52, spCost: 32000, mpCost: 0, power: 59 },
    { level: 23, requiredLevel: 52, spCost: 32000, mpCost: 0, power: 61 },
    { level: 24, requiredLevel: 52, spCost: 32000, mpCost: 0, power: 63 },
    // Level 56
    { level: 25, requiredLevel: 56, spCost: 35000, mpCost: 0, power: 66 },
    { level: 26, requiredLevel: 56, spCost: 35000, mpCost: 0, power: 68 },
    { level: 27, requiredLevel: 56, spCost: 35000, mpCost: 0, power: 70 },
    // Level 58
    { level: 28, requiredLevel: 58, spCost: 78000, mpCost: 0, power: 72 },
    { level: 29, requiredLevel: 58, spCost: 78000, mpCost: 0, power: 74 },
    // Level 60
    { level: 30, requiredLevel: 60, spCost: 100000, mpCost: 0, power: 76 },
    { level: 31, requiredLevel: 60, spCost: 100000, mpCost: 0, power: 78 },
    // Level 62
    { level: 32, requiredLevel: 62, spCost: 150000, mpCost: 0, power: 80 },
    { level: 33, requiredLevel: 62, spCost: 150000, mpCost: 0, power: 82 },
    // Level 64
    { level: 34, requiredLevel: 64, spCost: 160000, mpCost: 0, power: 84 },
    { level: 35, requiredLevel: 64, spCost: 160000, mpCost: 0, power: 86 },
    // Level 66
    { level: 36, requiredLevel: 66, spCost: 250000, mpCost: 0, power: 88 },
    { level: 37, requiredLevel: 66, spCost: 250000, mpCost: 0, power: 91 },
    // Level 68
    { level: 38, requiredLevel: 68, spCost: 280000, mpCost: 0, power: 93 },
    { level: 39, requiredLevel: 68, spCost: 280000, mpCost: 0, power: 95 },
    // Level 70
    { level: 40, requiredLevel: 70, spCost: 360000, mpCost: 0, power: 97 },
    { level: 41, requiredLevel: 70, spCost: 360000, mpCost: 0, power: 99 },
    // Level 72
    { level: 42, requiredLevel: 72, spCost: 540000, mpCost: 0, power: 102 },
    { level: 43, requiredLevel: 72, spCost: 540000, mpCost: 0, power: 104 },
    // Level 74
    { level: 44, requiredLevel: 74, spCost: 770000, mpCost: 0, power: 106 },
    { level: 45, requiredLevel: 74, spCost: 770000, mpCost: 0, power: 108 },
  ],
};

