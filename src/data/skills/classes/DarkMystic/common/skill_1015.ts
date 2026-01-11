import { SkillDefinition } from "../../../types";

// Battle Heal - 15 levels from XML
// power: 83.0, 95.0, 107.0, 121.0, 135.0, 151.0, 176.0, 185.0, 195.0, 224.0, 234.0, 245.0, 278.0, 289.0, 301.0
// mpConsume: 20, 22, 25, 28, 32, 35, 39, 41, 43, 49, 52, 53, 57, 59, 62
const battleHealPower = [83.0, 95.0, 107.0, 121.0, 135.0, 151.0, 176.0, 185.0, 195.0, 224.0, 234.0, 245.0, 278.0, 289.0, 301.0];
const battleHealMp = [20, 22, 25, 28, 32, 35, 39, 41, 43, 49, 52, 53, 57, 59, 62];

export const skill_1015: SkillDefinition = {
  id: 1015,
  code: "DM_1015",
  name: "Battle Heal",
  description: "Quickly recovers HP.\n\nБыстро восстанавливает HP.",
  icon: "/skills/Skill1015_0.jpg",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 2,
  cooldown: 3,
  levels: battleHealPower.map((power, index) => ({
    level: index + 1,
    requiredLevel: index < 3 ? 14 : index < 6 ? 20 : index < 9 ? 30 : index < 12 ? 40 : index < 15 ? 50 : 60,
    spCost: index < 3 ? 700 : index < 6 ? 2000 : index < 9 ? 5000 : index < 12 ? 15000 : index < 15 ? 35000 : 60000,
    mpCost: battleHealMp[index],
    power,
  })),
};


