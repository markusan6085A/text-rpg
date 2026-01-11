import { SkillDefinition } from "../../../types";

// Hate - provokes opponent to attack (higher level version of Aggression)
export const skill_0028_Hate: SkillDefinition = {
  id: 28,
  code: "SK_0028_Hate",
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
    { level: 25, requiredLevel: 52, spCost: 31000, mpCost: 45, power: 1492 },
  ],
};

