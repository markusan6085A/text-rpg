import { SkillDefinition } from "../../../types";

// Tempest - 15 levels from XML
// Power: 31, 33, 34, 36, 38, 39, 41, 43, 45, 46, 48, 50, 51, 53, 54 (from спелшоувер.txt)
// mpConsume: 62, 65, 68, 70, 74, 77, 80, 83, 87, 89, 93, 95, 98, 100, 103 (from спелшоувер.txt)
// mpConsume breakdown: 13+49, 13+52, 14+54, 14+56, 15+59, 15+62, 16+64, 17+66, 18+69, 18+71, 19+74, 19+76, 20+78, 20+80, 21+82
const powerValues = [31, 33, 34, 36, 38, 39, 41, 43, 45, 46, 48, 50, 51, 53, 54];
const mpConsumeInitValues = [13, 13, 14, 14, 15, 15, 16, 17, 18, 18, 19, 19, 20, 20, 21];
const mpConsumeValues = [49, 52, 54, 56, 59, 62, 64, 66, 69, 71, 74, 76, 78, 80, 82];
const magicLvlValues = [46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74];

export const skill_1176: SkillDefinition = {
  id: 1176,
  code: "SP_1176",
  name: "Tempest",
  description: "Calls forth a severe storm to attack multiple enemies. Power 31.\n\nАтака ветром, кастуется на врагов, действует на врагов в радиусе 200 вокруг выбранной цели в пределах дальности 500: - Магическая атака силой 31-54.",
  icon: "/skills/skill1176.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "wind",
  target: "enemy",
  scope: "area",
  castTime: 5,
  cooldown: 15,
  levels: powerValues.map((power, index) => ({
    level: index + 1,
    requiredLevel: magicLvlValues[index],
    spCost: index < 2 ? 30000 : index < 4 ? 43000 : index < 6 ? 48000 : index < 8 ? 52000 : index < 9 ? 56000 : index < 10 ? 110000 : index < 11 ? 160000 : index < 12 ? 210000 : index < 13 ? 250000 : index < 14 ? 350000 : index < 15 ? 390000 : index < 16 ? 520000 : index < 17 ? 750000 : 1100000,
    mpCost: mpConsumeInitValues[index] + mpConsumeValues[index],
    power,
  })),
};

