import { SkillDefinition } from "../../../types";

// Armor Crush - powerful damage skill with debuff
// XML: mpConsume: 35, hpConsume: 338, power: 3077, hitTime: 2000, reuseDelay: 15000
// Stun 9s, pDef -30%, mDef -30%, power 1973 (from description, but XML shows 3077)
export const skill_0362: SkillDefinition = {
  id: 362,
  code: "FS_0362",
  name: "Armor Crush",
  description: "Inflicts powerful damage and instantly throws the target into a state of shock with greatly decreased P. Def. and M. Def. Critical and over-hit are possible. Usable when one is equipped with a sword, blunt weapon, two-handed sword, or two-handed blunt weapon. Power 1973.\n\nНаносит мощный урон и мгновенно вводит цель в состояние шока с сильно уменьшенной физ. защитой и маг. защитой. Возможны критический удар и оверхит. Используется при экипировке меча, тупого оружия, двуручного меча или двуручного тупого оружия.",
  icon: "/skills/skill0362.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 2.0,
  cooldown: 15,
  hpCost: 254, // From description
  levels: [
    { level: 1, requiredLevel: 77, spCost: 13000000, mpCost: 65, power: 1973 }, // Power from description
  ],
};

