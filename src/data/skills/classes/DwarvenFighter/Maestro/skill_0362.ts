import { SkillDefinition } from "../../../types";

// Armor Crush - powerful damage skill with debuff
// File: mpCost: 65, hpCost: 254, power: 1973, castTime: 2s, cooldown: 15s
// XML: mpConsume: 35, hpConsume: 338, power: 3077, but using file values
export const skill_0362: SkillDefinition = {
  id: 362,
  code: "MA_0362",
  name: "Armor Crush",
  description: "Inflicts powerful damage and instantly throws the target into a state of shock with greatly decreased P. Def. and M. Def. Critical and over-hit are possible. Usable when one is equipped with a sword, blunt weapon, two-handed sword, or two-handed blunt weapon. Power 1973.\n\nНаносит мощный урон и мгновенно вводит цель в состояние шока с сильно уменьшенной физ. защитой и маг. защитой на 30%. Возможны критический удар и оверхит. Используется при экипировке меча, тупого оружия, двуручного меча или двуручного тупого оружия.",
  icon: "/skills/skill0362.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 2.0,
  cooldown: 15,
  hpCost: 254, // From file
  effects: [
    { stat: "pDef", mode: "multiplier", multiplier: 0.7 }, // -30% P. Def
    { stat: "mDef", mode: "multiplier", multiplier: 0.7 }, // -30% M. Def
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 13000000, mpCost: 65, power: 1973 }, // Power from file
  ],
};

