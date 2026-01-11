import { SkillDefinition } from "../../../types";

// Blaze - 8 levels from XML
// power: 23.0, 26.0, 29.0, 32.0, 35.0, 38.0, 42.0, 44.0
// mpConsume: 14, 16, 17, 18, 20, 21, 23, 24
const blazePower = [23.0, 26.0, 29.0, 32.0, 35.0, 38.0, 42.0, 44.0];
const blazeMp = [14, 16, 17, 18, 20, 21, 23, 24];

export const skill_1221: SkillDefinition = {
  id: 1221,
  code: "DME_1221",
  name: "Blaze",
  description: "Fire element attack.\n\nАтака огнем.",
  icon: "/skills/skill1221.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  element: "fire",
  castTime: 4,
  cooldown: 6,
  levels: blazePower.map((power, index) => ({
    level: index + 1,
    requiredLevel: index < 2 ? 40 : index < 4 ? 44 : index < 6 ? 48 : 52,
    spCost: index < 2 ? 19000 : index < 4 ? 43000 : index < 6 ? 110000 : 250000,
    mpCost: blazeMp[index],
    power,
  })),
};
