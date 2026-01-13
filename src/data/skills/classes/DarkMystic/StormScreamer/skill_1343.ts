import { SkillDefinition } from "../../../types";

// Dark Vortex
export const skill_1343: SkillDefinition = {
  id: 1343,
  code: "SS_1343",
  name: "Dark Vortex",
  description: "Creates a vortex that connects to the dimension of darkness. While launching a dark magic attack, it absorbs HP, instantly decreases the enemy's resistance to dark attack and decreases MP continuously. Power 139.\n\nАтака тьмой на 30 сек. с базовым шансом 80% (прохождение зависит от WIT цели), кастуется на врагов, действует в пределах дальности 900: - Атака силой 139. Из нанесенных повреждений 30% перегоняется в ваши HP. - Отнимает у цели по 60 MP раз в 5 сек. - Уменьшает защиту от атак тьмой на 30%.",
  icon: "/skills/skill1343.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "dark",
  target: "enemy",
  scope: "single",
  castTime: 6,
  cooldown: 60,
  duration: 30,
  chance: 80,
  tickInterval: 5,
  mpPerTick: -60, // -60 MP every 5 seconds
  effects: [
    { stat: "darkResist", mode: "multiplier", multiplier: 0.7 }, // -30% dark resistance
    { stat: "vampirism", mode: "percent", value: 30 }, // 30% HP absorption
  ],
  levels: [
    {
      level: 1,
      requiredLevel: 76,
      spCost: 10000000,
      mpCost: 105, // 21 + 84
      power: 139.0,
    },
  ],
};

