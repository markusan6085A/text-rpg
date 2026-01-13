import { SkillDefinition } from "../../../types";

// Anti Magic - continuation from common (levels 5-12 for Shillien Oracle)
// mDef values from XML: 34, 36, 40, 42, 43, 46, 47, 49 (continuing from common level 4 = 14)
const oracleAntiMagicMdef = [34, 36, 40, 42, 43, 46, 47, 49];

export const skill_0146: SkillDefinition = {
  id: 146,
  code: "DMO_0146",
  name: "Anti Magic",
  description: "Increases Magic Defense.\n\nУвеличивает магическую защиту.",
  icon: "/skills/Skill0146_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "mDef", mode: "flat" }],
  levels: oracleAntiMagicMdef.map((mDef, index) => ({
    level: index + 5, // Levels 5-12
    requiredLevel: index < 2 ? 20 : index < 4 ? 25 : index < 6 ? 30 : 35,
    spCost: index < 2 ? 1600 : index < 4 ? 3200 : index < 6 ? 5800 : 12000,
    mpCost: 0,
    power: mDef,
  })),
};

