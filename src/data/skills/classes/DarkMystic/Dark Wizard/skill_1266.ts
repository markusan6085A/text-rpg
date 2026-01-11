import { SkillDefinition } from "../../../types";

// Shadow Spark - 3 levels from XML
// power: 39.0, 47.0, 55.0
// mpConsume: 22, 26, 30
// mpConsume_Init: 6, 7, 8
const shadowSparkPower = [39.0, 47.0, 55.0];
const shadowSparkMp = [22, 26, 30];
const shadowSparkMpInit = [6, 7, 8];
const shadowSparkMagicLvl = [25, 30, 35];

export const skill_1266: SkillDefinition = {
  id: 1266,
  code: "DW_1266",
  name: "Shadow Spark",
  description: "Launches a dark magical attack. Over-hit is possible. Power 39-55.\n\nАтака тьмой, кастуется на врагов, действует в пределах дальности 750: - Магическая атака силой 39-55. Возможен оверхит.",
  icon: "/skills/skill1266.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "dark",
  target: "enemy",
  scope: "single",
  castTime: 5,
  cooldown: 30,
  // overHit: true, // Note: Over-hit capability (handled in battle logic)
  levels: shadowSparkPower.map((power, index) => ({
    level: index + 1,
    requiredLevel: shadowSparkMagicLvl[index],
    spCost: index < 1 ? 5800 : index < 2 ? 11000 : 18000,
    mpCost: shadowSparkMpInit[index] + shadowSparkMp[index],
    power,
  })),
};

