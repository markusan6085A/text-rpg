import { SkillDefinition } from "../../../types";

// Wind Vortex
export const skill_1341: SkillDefinition = {
  id: 1341,
  code: "SS_1341",
  name: "Wind Vortex",
  description: "Creates a vortex that connects to the dimension of wind. While launching a wind attack, it instantly decreases the enemy's resistance to wind attack, Speed, Atk. Spd., and Casting Spd at the same time. Decreases MP continuously. Over-hit is possible. Power 140.\n\nАтака ветром на 30 сек. с базовым шансом 80% (прохождение зависит от WIT цели), кастуется на врагов, действует в пределах дальности 900: - Магическая атака силой 140. Возможен оверхит. - Уменьшает скорость передвижения на 10%. - Уменьшает скорость атаки на 10%. - Уменьшает скорость каста на 30%. - Отнимает у цели по 60 MP раз в 5 сек. - Уменьшает защиту от атак ветром на 20%.",
  icon: "/skills/skill1341.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "wind",
  target: "enemy",
  scope: "single",
  castTime: 6,
  cooldown: 60,
  duration: 30,
  chance: 80,
  tickInterval: 5,
  mpPerTick: -60, // -60 MP every 5 seconds
  effects: [
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.9 }, // -10% movement speed
    { stat: "attackSpeed", mode: "multiplier", multiplier: 0.9 }, // -10% attack speed
    { stat: "castSpeed", mode: "multiplier", multiplier: 0.7 }, // -30% cast speed
    { stat: "windResist", mode: "multiplier", multiplier: 0.8 }, // -20% wind resistance
  ],
  levels: [
    {
      level: 1,
      requiredLevel: 77,
      spCost: 20000000,
      mpCost: 105, // 21 + 84
      power: 140.0,
    },
  ],
};

