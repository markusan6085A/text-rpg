import { SkillDefinition } from "../../../types";

// Heal - 18 levels from XML
// power: 49.0, 58.0, 67.0, 83.0, 95.0, 107.0, 121.0, 135.0, 151.0, 176.0, 185.0, 195.0, 224.0, 234.0, 245.0, 278.0, 289.0, 301.0
// mpConsume: 8, 10, 11, 13, 15, 17, 19, 21, 24, 26, 28, 29, 33, 35, 35, 38, 40, 41
const healPower = [49.0, 58.0, 67.0, 83.0, 95.0, 107.0, 121.0, 135.0, 151.0, 176.0, 185.0, 195.0, 224.0, 234.0, 245.0, 278.0, 289.0, 301.0];
const healMpCost = [8, 10, 11, 13, 15, 17, 19, 21, 24, 26, 28, 29, 33, 35, 35, 38, 40, 41];

export const skill_1011: SkillDefinition = {
  id: 1011,
  code: "DM_1011",
  name: "Heal",
  description: "Recovers HP.\n\nВосстанавливает HP.",
  icon: "/skills/Skill1011_0.jpg",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "single",
  castTime: 5,
  cooldown: 10,
  levels: healPower.map((power, index) => ({
    level: index + 1,
    requiredLevel: index < 3 ? 7 : index < 6 ? 14 : index < 9 ? 20 : index < 12 ? 30 : index < 15 ? 40 : index < 18 ? 50 : 60,
    spCost: index < 3 ? 160 : index < 6 ? 700 : index < 9 ? 2000 : index < 12 ? 5000 : index < 15 ? 15000 : index < 18 ? 35000 : 60000,
    mpCost: healMpCost[index],
    power,
  })),
};


