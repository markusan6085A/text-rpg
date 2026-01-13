import { SkillDefinition } from "../../../types";

// Boost Mana - 8 levels from XML (passive)
// mp: 30, 50, 70, 100, 140, 152, 180, 200
const boostManaMp = [30, 50, 70, 100, 140, 152, 180, 200];

export const skill_0213: SkillDefinition = {
  id: 213,
  code: "DW_0213",
  name: "Boost Mana",
  description: "Increases maximum MP.\n\nУвеличивает максимальные MP на 30-200.",
  icon: "/skills/Skill0213_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "maxMp", mode: "flat" }],
  levels: boostManaMp.map((mp, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 20 : index < 4 ? 25 : index < 6 ? 30 : 35,
    spCost: index < 2 ? 3300 : index < 4 ? 6500 : index < 6 ? 12000 : 23000,
    mpCost: 0,
    power: mp,
  })),
};

