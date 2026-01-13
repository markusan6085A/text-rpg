import { SkillDefinition } from "../../../types";

export const Skill_0362: SkillDefinition = {
  id: 362,
  code: "OR_0362",
  name: "Armor Crush",
  description: "Inflicts powerful damage and instantly throws the target into a state of shock with greatly decreased P. Def. and M. Def. Critical and over-hit are possible. Usable when one is equipped with a sword, blunt weapon, two-handed sword, or two-handed blunt weapon.\n\nНаносит мощный урон и мгновенно вводит цель в состояние шока с сильно уменьшенной физ. и маг. защитой. Возможны критический удар и оверхит. Используется при экипировке меча, дубины, двуручного меча или двуручной дубины.",
  icon: "/skills/skill0362.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 2,
  cooldown: 15,
  hpCost: 254,
  effects: [
    { stat: "stunResist", mode: "flat", chance: 40, duration: 2 },
    { stat: "pDef", mode: "multiplier", multiplier: 0.7 },
    { stat: "mDef", mode: "multiplier", multiplier: 0.7 },
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 65, power: 1973 },
  ],
};

