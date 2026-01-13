import { SkillDefinition } from "../../../types";

// Seal of Binding - 17 levels from XML (aura skill, roots enemies)
// mpConsume: 27, 32, 36, 42, 47, 52, 56, 61, 64, 66, 69, 71, 74, 76, 78, 80, 82
const bindingMp = [27, 32, 36, 42, 47, 52, 56, 61, 64, 66, 69, 71, 74, 76, 78, 80, 82];

export const skill_1208: SkillDefinition = {
  id: 1208,
  code: "DME_1208",
  name: "Seal of Binding",
  description: "Aura skill that roots nearby enemies for 30 seconds.\n\nАура, обездвиживающая ближайших врагов на 30 секунд.",
  icon: "/skills/skill1208.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "party",
  castTime: 4,
  cooldown: 20,
  duration: 30,
  chance: 40,
  stackType: "root",
  stackOrder: 1,
  levels: bindingMp.map((mp, index) => ({
    level: index + 1,
    requiredLevel: index < 3 ? 40 : index < 6 ? 44 : index < 9 ? 48 : index < 12 ? 52 : index < 15 ? 56 : 60,
    spCost: index < 3 ? 39000 : index < 6 ? 85000 : index < 9 ? 140000 : index < 12 ? 200000 : index < 15 ? 300000 : 400000,
    mpCost: mp,
    power: 0,
  })),
};
