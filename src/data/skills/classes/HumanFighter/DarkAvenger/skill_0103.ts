import { SkillDefinition } from "../../../types";

// Corpse Plague для DarkAvenger (рівні 1-4)
export const skill_0103: SkillDefinition = {
  id: 103,
  code: "DAV_0103",
  name: "Corpse Plague",
  description: "Corpse emits a cloud that poisons nearby enemies. Instantly poisons nearby enemies. Effect 5.\n\nТруп испускает облако, которое отравляет ближайших врагов. Мгновенно отравляет врагов в радиусе 200. Наносит 93-240 HP урона каждые 5 сек в течение 30 сек. Шанс: 35% (зависит от MEN врага). Каст: 1.5 сек. Перезарядка: 20 сек.",
  category: "debuff",
  powerType: "flat",
  target: "self",
  scope: "area",
  castTime: 1.5,
  cooldown: 20,
  chance: 35,
  icon: "/skills/skill0103.gif",
  effects: [
    { stat: "poisonResist", mode: "flat", duration: 30 }, // Poison effect
  ],
  levels: [
    { level: 1, requiredLevel: 46, spCost: 47000, mpCost: 42, power: 93 },
    { level: 2, requiredLevel: 58, spCost: 170000, mpCost: 54, power: 190 },
    { level: 3, requiredLevel: 62, spCost: 310000, mpCost: 58, power: 220 },
    { level: 4, requiredLevel: 70, spCost: 660000, mpCost: 65, power: 240 },
  ],
};

