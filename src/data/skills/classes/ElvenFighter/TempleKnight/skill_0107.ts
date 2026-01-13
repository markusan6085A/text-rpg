import { SkillDefinition } from "../../../types";

// Holy Aura - instantaneous hold attack upon nearby undead monsters
export const skill_0107: SkillDefinition = {
  id: 107,
  code: "TK_0107",
  name: "Holy Aura",
  description: "Instantaneous hold attack upon nearby undead monsters. If cast on a held target, the spell has no effect.\n\nМгновенная атака удержания на ближайших нежити в радиусе 30. Шанс успеха 40% (зависит от WIT стата), действует на врагов, действует в радиусе 200. Обездвиживает. Не действует на уже обездвиженных целей, если.",
  icon: "/skills/skill0107.gif",
  category: "debuff",
  powerType: "none",
  target: "enemy",
  scope: "area",
  castTime: 2,
  cooldown: 40,
  chance: 40,
  effects: [
    { stat: "holdResist", mode: "flat", duration: 30, chance: 40 }, // Hold на 30 секунд з 40% шансом
  ],
  levels: [
    { level: 1, requiredLevel: 58, spCost: 200000, mpCost: 80, power: 0 },
    { level: 2, requiredLevel: 60, spCost: 220000, mpCost: 83, power: 0 },
    { level: 3, requiredLevel: 62, spCost: 310000, mpCost: 86, power: 0 },
    { level: 4, requiredLevel: 64, spCost: 370000, mpCost: 89, power: 0 },
    { level: 5, requiredLevel: 66, spCost: 580000, mpCost: 92, power: 0 },
    { level: 6, requiredLevel: 68, spCost: 650000, mpCost: 95, power: 0 },
    { level: 7, requiredLevel: 70, spCost: 720000, mpCost: 97, power: 0 },
    { level: 8, requiredLevel: 72, spCost: 1200000, mpCost: 100, power: 0 },
    { level: 9, requiredLevel: 74, spCost: 1900000, mpCost: 102, power: 0 },
  ],
};

