import { SkillDefinition } from "../../../types";

export const skill_1289: SkillDefinition = {
  id: 1289,
  code: "HM_1289",
  name: "Inferno",
  description: "Devastating double fire attack. Flames reduce enemy's HP. Effect 10. Power 350. Requires two Seeds of Fire. Атака огнем на 15 сек., кастуется на врагов, действует в пределах дальности 900: - Магическая атака силой 350. - Отнимает у цели по 118 HP раз в 1 сек. - Созданная магическая связка удаляется. - Требует наложенные на себя две силы: Seed of Fire и Seed of Fire. Вытесняет или вытесняется следующими баффами / дебаффами...",
  icon: "/skills/skill1289.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "area",
  castTime: 7,
  cooldown: 3600,
  levels: [
  {
    "level": 1,
    "requiredLevel": 70,
    "spCost": 590000,
    "mpCost": 250,
    "power": 350
  }
]
};
