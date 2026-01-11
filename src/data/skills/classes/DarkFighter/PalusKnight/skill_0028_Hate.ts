import { SkillDefinition } from "../../../types";

// Hate - provokes opponent's desire to attack (continuation of Aggression)
export const skill_0028_Hate: SkillDefinition = {
  id: 28,
  code: "PK_0028_H",
  name: "Hate",
  description: "Provokes one's opponent's desire to attack.\n\nПровоцирует желание противника атаковать.",
  icon: "/skills/skill0028.gif",
  category: "special",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1,
  cooldown: 3,
  duration: 3,
  levels: [
    { level: 2, requiredLevel: 24, spCost: 2900, mpCost: 21, power: 679 },
    { level: 3, requiredLevel: 24, spCost: 2900, mpCost: 22, power: 703 },
  ],
};

