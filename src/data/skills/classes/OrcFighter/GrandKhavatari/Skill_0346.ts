import { SkillDefinition } from "../../../types";

export const Skill_0346: SkillDefinition = {
  id: 346,
  code: "GK_0346",
  name: "Force Rage",
  description: "Fists weapon attack that emits energy to strike a distant target while gathering force for use in other special attack skills. Force can be gathered up to level 7. Critical attack is possible. Usable when one is equipped with a fist type weapon.\n\nАтака оружием для рукопашного боя, которая выпускает энергию для удара по дальнему врагу, собирая силу для использования в других специальных атаках. Сила может быть собрана до уровня 7. Возможна критическая атака. Используется при экипировке оружия для рукопашного боя.",
  icon: "/skills/skill0346.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 1,
  hpCost: 50,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 64000000, mpCost: 5, power: 7 },
  ],
};

