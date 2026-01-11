import { SkillDefinition } from "../../../types";

// Fast Mana Recovery - 7 levels from XML (passive)
// regMp: 1.1, 1.5, 1.9, 2.3, 2.7, 3.1, 3.4 (flat addition)
const fastManaRegen = [1.1, 1.5, 1.9, 2.3, 2.7, 3.1, 3.4];

export const skill_0229: SkillDefinition = {
  id: 229,
  code: "DMO_0229",
  name: "Fast Mana Recovery",
  description: "Accelerates MP regeneration.\n\nУскоряет восстановление MP.",
  icon: "/skills/Skill0229_0.jpg",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "mpRegen", mode: "flat" }],
  levels: fastManaRegen.map((regen, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 20 : index < 4 ? 30 : index < 6 ? 35 : 40,
    spCost: index < 2 ? 6500 : index < 4 ? 23000 : index < 6 ? 50000 : 100000,
    mpCost: 0,
    power: regen,
  })),
};

