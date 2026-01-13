import { SkillDefinition } from "../../../types";

// Fast HP Recovery - 8 levels from XML (passive)
// regHp: 1.1, 1.6, 1.7, 2.1, 2.6, 2.7, 3.4, 4.0
const fastHpRegen = [1.1, 1.6, 1.7, 2.1, 2.6, 2.7, 3.4, 4.0];

export const skill_0212: SkillDefinition = {
  id: 212,
  code: "SP_0212",
  name: "Fast HP Recovery",
  description: "Increases HP recovery speed.\n\nУвеличивает скорость восстановления HP.",
  icon: "/skills/Skill0212.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [{ stat: "hpRegen", mode: "flat" }],
  levels: fastHpRegen.map((regen, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 24 : index < 4 ? 36 : index < 6 ? 48 : index < 7 ? 60 : 72,
    spCost: index < 2 ? 6400 : index < 4 ? 18000 : index < 6 ? 50000 : index < 7 ? 100000 : 200000,
    mpCost: 0,
    power: regen,
  })),
};

