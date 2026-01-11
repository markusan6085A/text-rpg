import { SkillDefinition } from "../../../types";

// Riposte Stance - toggle skill that reflects damage
// XML: mpConsume: 35, ManaDamOverTime: 35 per 3s (≈11.67 MP/s), reflectDam: 30, reflectSkillPhysic: 30, reflectSkillMagic: 30
// pAtkSpd: 0.8, runSpd: 0.9, accCombat: -4
export const skill_0340: SkillDefinition = {
  id: 340,
  code: "FS_0340",
  name: "Riposte Stance",
  description: "Uses weapon to reflect incoming attacks. It reflects the damage received and has a chance to reflect buff/de-buff skill attacks. The damage received through the skill use and remote attack are excluded. Moving speed, Atk. Spd. and accuracy are decreased. MP will be continuously consumed while in effect.\n\nИспользует оружие для отражения входящих атак. Отражает полученный урон и имеет шанс отразить атаки баффов/дебаффов. Урон, полученный через использование навыка и удаленную атаку, исключается. Скорость передвижения, скорость атаки и точность уменьшены. MP будет непрерывно потребляться во время действия.",
  icon: "/skills/skill0340.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: -12, // ≈35 MP per 3s = 11.67 MP/s, rounded to 12
  tickInterval: 1,
  effects: [
    { stat: "reflect", mode: "flat", value: 30 },
    { stat: "reflectSkillPhysic", mode: "flat", value: 30 },
    { stat: "reflectSkillMagic", mode: "flat", value: 30 },
    { stat: "attackSpeed", mode: "multiplier", multiplier: 0.8 },
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.9 },
    { stat: "accuracy", mode: "flat", value: -4 },
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 13000000, mpCost: 35, power: 0 },
  ],
};

