import { SkillDefinition } from "../../../types";

export const Skill_0340: SkillDefinition = {
  id: 340,
  code: "DL_0340",
  name: "Riposte Stance",
  description: "Uses weapon to reflect incoming attacks. It reflects the damage received and has a chance to reflect buff/de-buff skill attacks. The damage received through the skill use and remote attack are excluded. Moving speed, Atk. Spd. and accuracy are decreased. MP will be continuously consumed while in effect.\n\nИспользует оружие для отражения входящих атак. Отражает полученный урон и имеет шанс отразить бафф/дебафф скілы. Урон, полученный через использование скіла и дистанционную атаку, исключается. Скорость движения, скорость атаки и точность уменьшены. MP потребляется непрерывно во время действия.",
  category: "toggle",
  powerType: "none",
  toggle: true,
  mpPerTick: -30, // Споживає 30 MP кожні 3 секунди (високорівневий скіл)
  tickInterval: 3,
  icon: "/skills/0340.jpg",
  levels: [
    { level: 1, requiredLevel: 77, spCost: 12250000, mpCost: 0, power: 0 },
  ],
};

