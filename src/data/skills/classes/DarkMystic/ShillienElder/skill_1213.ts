import { SkillDefinition } from "../../../types";

// Seal of Mirage - 13 levels from XML (aura skill, confuses mobs)
// mpConsume: 47, 52, 56, 61, 64, 66, 69, 71, 74, 76, 78, 80, 82
const mirageMp = [47, 52, 56, 61, 64, 66, 69, 71, 74, 76, 78, 80, 82];

export const skill_1213: SkillDefinition = {
  id: 1213,
  code: "DME_1213",
  name: "Seal of Mirage",
  description: "Aura skill that confuses nearby mobs for 6 seconds.\n\nАура, путающая ближайших мобов на 6 секунд.",
  icon: "/skills/skill1213.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "party",
  castTime: 4,
  cooldown: 20,
  duration: 6,
  chance: 100, // Confusion always applies if it hits
  levels: mirageMp.map((mp, index) => ({
    level: index + 1,
    requiredLevel: index < 3 ? 44 : index < 6 ? 48 : index < 9 ? 52 : index < 12 ? 56 : 60,
    spCost: index < 3 ? 39000 : index < 6 ? 85000 : index < 9 ? 140000 : index < 12 ? 200000 : 300000,
    mpCost: mp,
    power: 0,
  })),
};
