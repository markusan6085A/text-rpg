import { SkillDefinition } from "../../../types";

// Curse of Doom
export const skill_1336: SkillDefinition = {
  id: 1336,
  code: "ST_1336",
  name: "Curse of Doom",
  description: "Temporarily prevent the use of enemy's physical skills and magic. Дебафф Curse of Doom на 2 мин. с базовым шансом 80% (прохождение зависит от WIT цели), кастуется только на врагов, действует в пределах дальности 600: - Блокирует магию. - Блокирует физические умения.",
  category: "debuff",
  powerType: "none",
  icon: "/skills/skill1336.gif",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 120,
  duration: 120,
  chance: 80,
  levels: [{ level: 1, requiredLevel: 77, spCost: 13000000, mpCost: 70, power: 0 }],
};
