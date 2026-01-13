import { SkillDefinition } from "../../../types";

// Energy Bolt - launches a weak bolt of magical energy
export const skill_1274: SkillDefinition = {
  id: 1274,
  code: "EW_1274",
  name: "Energy Bolt",
  description: "Launches a weak bolt of magical energy. MP consumption rate is low and Casting Speed is short. Power 13.\n\nЗапускает слабый болт магической энергии. Низкое потребление MP и короткая скорость каста. Сила: 13-22 (зависит от уровня). Кастуется на врагов, действует в пределах дальности 400. Каст: 2 сек. Перезарядка: 3 сек.",
  icon: "/skills/skill1274.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 2,
  cooldown: 3,
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3300, mpCost: 10, power: 13 },
    { level: 2, requiredLevel: 25, spCost: 6100, mpCost: 12, power: 16 },
    { level: 3, requiredLevel: 30, spCost: 12000, mpCost: 14, power: 19 },
    { level: 4, requiredLevel: 35, spCost: 21000, mpCost: 15, power: 22 },
  ],
};

