import { SkillDefinition } from "../../../types";

// Summon Wild Hog Cannon - summons siege weapon
// XML: mpInitialConsume: 530, hitTime: 300000, reuseDelay: 20000
export const skill_0299: SkillDefinition = {
  id: 299,
  code: "WS_0299",
  name: "Summon Wild Hog Cannon",
  description: "Summons a siege weapon capable of movement in general mode and remote attack in siege mode. Switching modes takes 30 seconds. Summoning requires 120 Crystals: B-Grade and an additional 30 Gemstones: B-Grade per minute.\n\nПризывает осадное орудие, способное к движению в обычном режиме и дистанционной атаке в осадном режиме. Переключение режимов занимает 30 секунд. При призыве требуется 120 Кристаллов: B-класса и дополнительно 30 Самоцветов: B-класса в минуту.",
  icon: "/skills/skill0299.gif",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 300,
  cooldown: 20,
  levels: [
    { level: 1, requiredLevel: 58, spCost: 800000, mpCost: 530, power: 0 },
  ],
};

