import { SkillDefinition } from "../../../types";

// Fast Mana Recovery - 7 levels from XML (passive)
// regMp: 1.1, 1.5, 1.9, 2.3, 2.7, 3.1, 3.4
const fastManaRegen = [1.1, 1.5, 1.9, 2.3, 2.7, 3.1, 3.4];

export const skill_0229: SkillDefinition = {
  id: 229,
  code: "DW_0229",
  name: "Fast Mana Recovery",
  description: "Increases MP Recovery Speed.\n\nУскоряет регенерацию MP на 1.1-3.4 MP/тик.",
  icon: "/skills/Skill0229_0.jpg",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "mpRegen", mode: "flat" }],
  levels: fastManaRegen.map((regen, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 25 : index < 4 ? 35 : index < 6 ? 40 : 45,
    spCost: index < 2 ? 5800 : index < 4 ? 18000 : index < 6 ? 50000 : 100000,
    mpCost: 0,
    power: regen,
  })),
};

