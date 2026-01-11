import { SkillDefinition } from "../../../types";

// Vampiric Rage - 4 levels from XML (buff skill, absorbs damage as HP)
// absorbDam: 6, 7, 8, 9 (percentage of damage absorbed as HP)
// mpConsume: 21, 31, 43, 53
const vampiricRageAbsorb = [6, 7, 8, 9];
const vampiricRageMp = [21, 31, 43, 53];

export const skill_1268: SkillDefinition = {
  id: 1268,
  code: "DME_1268",
  name: "Vampiric Rage",
  description: "Absorbs a portion of damage dealt as HP restoration.\n\nПоглощает часть нанесенного урона как восстановление HP.",
  icon: "/skills/skill1268.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [{ stat: "vampirism", mode: "percent" }], // Value from level.power (absorbDam percentage)
  stackType: "vampRage",
  stackOrder: 1,
  levels: vampiricRageAbsorb.map((absorb, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 44 : index < 3 ? 58 : 72,
    spCost: index < 2 ? 43000 : index < 3 ? 180000 : 1400000,
    mpCost: vampiricRageMp[index],
    power: absorb,
  })),
};

