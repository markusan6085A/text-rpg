import { SkillDefinition } from "../../../types";

// Summon Dark Panther для DarkAvenger (рівні 1-7)
export const skill_0283: SkillDefinition = {
  id: 283,
  code: "DAV_0283",
  name: "Summon Dark Panther",
  description: "Summons a Dark Panther capable of agile attacks. When summoning it, 1 Crystal: C-Grade will be consumed. Afterwards, 1 additional crystal will be consumed at a regular interval for 4 times. 15% of acquired Exp will also be consumed.\n\nПризывает Темную Пантеру, способную на ловкие атаки. При призыве потребляется 1-4 Кристалл: C-Grade. Затем каждые 4 раза потребляется дополнительный кристалл. Потребляет 15% получаемого опыта. Каст: 15 сек. Перезарядка: 20 сек.",
  category: "special",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 15,
  cooldown: 20,
  icon: "/skills/skill0283.gif",
  levels: [
    { level: 1, requiredLevel: 40, spCost: 33000, mpCost: 70, power: 5 },
    { level: 2, requiredLevel: 49, spCost: 70000, mpCost: 88, power: 10 },
    { level: 3, requiredLevel: 58, spCost: 170000, mpCost: 107, power: 15 },
    { level: 4, requiredLevel: 62, spCost: 310000, mpCost: 115, power: 20 },
    { level: 5, requiredLevel: 66, spCost: 540000, mpCost: 123, power: 25 },
    { level: 6, requiredLevel: 70, spCost: 660000, mpCost: 130, power: 30 },
    { level: 7, requiredLevel: 72, spCost: 1800000, mpCost: 137, power: 35 },
  ],
};

