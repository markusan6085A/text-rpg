import { SkillDefinition } from "../../../types";

// Fast HP Recovery - 8 levels from XML (passive)
// regHp: 1.1, 1.6, 1.7, 2.1, 2.6, 2.7, 3.4, 4.0
const fastHpRegen = [1.1, 1.6, 1.7, 2.1, 2.6, 2.7, 3.4, 4.0];

export const skill_0212: SkillDefinition = {
  id: 212,
  code: "DW_0212",
  name: "Fast HP Recovery",
  description: "Increases HP recovery speed.\n\nУскоряет регенерацию HP на 1.1-4.0 HP/тик.",
  icon: "/skills/Skill0212.gif",
  category: "passive",
  powerType: "flat",
  target: "self",
  scope: "single",
  effects: [{ stat: "hpRegen", mode: "flat" }],
  levels: fastHpRegen.map((regen, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 35 : index < 4 ? 45 : index < 6 ? 55 : index < 7 ? 65 : 75,
    spCost: index < 2 ? 18000 : index < 4 ? 50000 : index < 6 ? 100000 : index < 7 ? 200000 : 300000,
    mpCost: 0,
    power: regen,
  })),
};

