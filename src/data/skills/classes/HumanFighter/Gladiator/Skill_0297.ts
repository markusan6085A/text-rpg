import { SkillDefinition } from "../../../types";

// Duelist Spirit           PvP.
export const Skill_0297: SkillDefinition = {
  id: 297,
  code: "GL_0297",
  name: "Duelist Spirit",
  description: "Temporarily increases Atk. Spd. Used with a two-bladed weapon.\n\nВременно увеличивает скорость атаки на 8-12% (зависит от уровня) и урон в PvP на 10-25% (зависит от типа атаки) на 60 сек. Используется с парным оружием. Каст: 1.5 сек. Перезарядка: 2 мин.",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  duration: 60,
  cooldown: 30,
  icon: "/skills/0297.jpg",
  effects: [{ stat: "atkSpeed", mode: "percent" }],
  levels: [
    { level: 1, requiredLevel: 64, spCost: 320000, mpCost: 30, power: 8 },
    { level: 2, requiredLevel: 72, spCost: 800000, mpCost: 34, power: 12 },
  ],
};

