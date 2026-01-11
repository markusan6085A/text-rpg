import { SkillDefinition } from "../../../types";

// Surrender To Poison - 17 levels from XML
// Increases poison vulnerability multiplier: 1.25, 1.25, 1.25, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3
// mpConsume: 9, 11, 12, 28, 31, 35, 38, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55
const surrenderPoisonVuln = [1.25, 1.25, 1.25, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3];
const surrenderPoisonMp = [9, 11, 12, 28, 31, 35, 38, 41, 43, 44, 46, 48, 49, 51, 52, 53, 55];

export const skill_1224: SkillDefinition = {
  id: 1224,
  code: "DME_1224",
  name: "Surrender To Poison",
  description: "Increases target's vulnerability to poison for 15 seconds.\n\nУвеличивает уязвимость цели к яду на 15 секунд.",
  icon: "/skills/skill1224.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 8,
  duration: 15,
  chance: 80,
  effects: [{ stat: "poisonResist", mode: "multiplier" }], // Value from level.power (vulnerability multiplier - reduces resistance)
  levels: surrenderPoisonVuln.map((vuln, index) => ({
    level: index + 1,
    requiredLevel: index < 3 ? 25 : index < 6 ? 35 : index < 9 ? 40 : index < 12 ? 44 : index < 15 ? 48 : 52,
    spCost: index < 3 ? 39000 : index < 6 ? 85000 : index < 9 ? 140000 : index < 12 ? 200000 : index < 15 ? 300000 : 400000,
    mpCost: surrenderPoisonMp[index],
    power: vuln,
  })),
};
