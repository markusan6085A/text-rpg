import { SkillDefinition } from "../../../types";

export const skill_0361: SkillDefinition = {
  id: 361,
  code: "DN_0361",
  name: "Shock Blast",
  description: "Throws a shock wave at enemies at a long distance canceling their target status. Instantly throws them into a state of shock which reduces their P. Def. and M. Def. greatly. Critical attack and over-hit are possible. Usable when one is equipped with a spear type weapon.\n\nБросает ударную волну по врагам на большом расстоянии, снимая статус цели. Мгновенно вводит их в состояние шока, которое значительно снижает их физ. защиту и маг. защиту на 30% на 5 сек. Сила: 1973. Игнорирует защиту щитом. Возможны критический удар и оверхит. Требуется копье. Каст: 4 сек. Перезарядка: 30 сек.",
  category: "magic_attack",
  powerType: "flat",
  target: "enemy",
  scope: "area",
  icon: "/skills/skill0361.gif",
  castTime: 4,
  cooldown: 30,
  levels: [
    { level: 1, requiredLevel: 77, spCost: 15000000, mpCost: 65, power: 1973 },
  ],
};

