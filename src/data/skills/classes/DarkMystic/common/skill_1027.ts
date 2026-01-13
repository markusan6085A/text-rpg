import { SkillDefinition } from "../../../types";

// Group Heal - 15 levels from XML
// power: 66.0, 76.0, 86.0, 97.0, 108.0, 121.0, 141.0, 148.0, 156.0, 179.0, 188.0, 196.0, 222.0, 231.0, 241.0
// mpConsume: 26, 30, 34, 38, 42, 47, 52, 55, 57, 66, 69, 70, 76, 79, 82
const groupHealPower = [66.0, 76.0, 86.0, 97.0, 108.0, 121.0, 141.0, 148.0, 156.0, 179.0, 188.0, 196.0, 222.0, 231.0, 241.0];
const groupHealMp = [26, 30, 34, 38, 42, 47, 52, 55, 57, 66, 69, 70, 76, 79, 82];

export const skill_1027: SkillDefinition = {
  id: 1027,
  code: "DM_1027",
  name: "Group Heal",
  description: "Recovers party member's HP.\n\nВосстанавливает HP членов группы.",
  icon: "/skills/Skill1027_0.jpg",
  category: "heal",
  powerType: "flat",
  target: "ally",
  scope: "party",
  castTime: 7,
  cooldown: 25,
  levels: groupHealPower.map((power, index) => ({
    level: index + 1,
    requiredLevel: index < 3 ? 14 : index < 6 ? 20 : index < 9 ? 30 : index < 12 ? 40 : index < 15 ? 50 : 60,
    spCost: index < 3 ? 700 : index < 6 ? 2000 : index < 9 ? 5000 : index < 12 ? 15000 : index < 15 ? 35000 : 60000,
    mpCost: groupHealMp[index],
    power,
  })),
};


