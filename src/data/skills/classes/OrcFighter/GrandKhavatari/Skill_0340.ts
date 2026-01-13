import { SkillDefinition } from "../../../types";

export const Skill_0340: SkillDefinition = {
  id: 340,
  code: "GK_0340",
  name: "Riposte Stance",
  description: "Uses weapon to reflect incoming attacks. It reflects the damage received and has a chance to reflect buff/de-buff skill attacks. The damage received through the skill use and remote attack are excluded. Moving speed, Atk. Spd. and accuracy are decreased. MP will be continuously consumed while in effect.\n\nИспользует оружие для отражения входящих атак. Отражает полученный урон и имеет шанс отразить баф/дебаф скіли. Урон, полученный через использование скіла и дистанционную атаку, исключается. Скорость передвижения, скорость атаки и точность уменьшаются. MP будет постоянно потребляться во время действия.",
  icon: "/skills/skill0340.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: 0.5,
  effects: [
    { stat: "reflect", mode: "flat", value: 30 },
    { stat: "reflectSkillPhysic", mode: "flat", value: 30 },
    { stat: "reflectSkillMagic", mode: "flat", value: 30 },
    { stat: "attackSpeed", mode: "multiplier", multiplier: 0.8 },
    { stat: "runSpeed", mode: "multiplier", multiplier: 0.9 },
    { stat: "accuracy", mode: "flat", value: -4 },
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 35, power: 0 },
  ],
};

