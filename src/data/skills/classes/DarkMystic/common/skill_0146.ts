import { SkillDefinition } from "../../../types";

// Anti Magic - 45 levels from XML
// mDef values: 10, 12, 14, 16, 18, 20, 23, 25, 28, 30, 34, 36, 40, 42, 43, 46, 47, 49, 52, 54, 56, 59, 61, 63, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 91, 93, 95, 97, 99, 102, 104, 106, 108
const mDefValues = [10, 12, 14, 16, 18, 20, 23, 25, 28, 30, 34, 36, 40, 42, 43, 46, 47, 49, 52, 54, 56, 59, 61, 63, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 91, 93, 95, 97, 99, 102, 104, 106, 108];

export const skill_0146: SkillDefinition = {
  id: 146,
  code: "DM_0146",
  name: "Anti Magic",
  description: "Increases Magic Defense.\n\nУвеличивает магическую защиту.",
  icon: "/skills/Skill0146_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "mDef", mode: "flat" }], // Flat addition from XML
  levels: mDefValues.map((mDef, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 7 : index < 4 ? 14 : index < 6 ? 20 : index < 8 ? 25 : index < 10 ? 30 : index < 12 ? 35 : index < 15 ? 40 : index < 20 ? 45 : index < 25 ? 50 : index < 30 ? 55 : index < 35 ? 60 : index < 40 ? 65 : 70,
    spCost: index < 2 ? 240 : index < 4 ? 1100 : index < 6 ? 3000 : index < 8 ? 5000 : index < 10 ? 8000 : index < 12 ? 12000 : index < 15 ? 20000 : index < 20 ? 35000 : index < 25 ? 50000 : index < 30 ? 70000 : index < 35 ? 90000 : index < 40 ? 110000 : 130000,
    mpCost: 0,
    power: mDef,
  })),
};



