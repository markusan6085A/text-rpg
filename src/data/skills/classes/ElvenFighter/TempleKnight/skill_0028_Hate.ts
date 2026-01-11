import { SkillDefinition } from "../../../types";

// Hate - provokes one's opponent's desire to attack (lv.25)
export const skill_0028_Hate: SkillDefinition = {
  id: 28,
  code: "TK_0028_Hate",
  name: "Hate",
  description: "Provokes one's opponent's desire to attack. Power 1492.\n\nПровоцирует желание противника атаковать. Провоцирует ближайших врагов в радиусе 600. Каст: 1 сек. Перезарядка: 3 сек.",
  icon: "/skills/skill0028.gif",
  category: "special",
  powerType: "flat",
  target: "enemy",
  scope: "area",
  castTime: 1,
  cooldown: 3,
  duration: 600, // 600 секунд згідно з описом
  levels: [
    { level: 25, requiredLevel: 52, spCost: 38000, mpCost: 45, power: 1492 },
  ],
};

