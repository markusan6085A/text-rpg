import { SkillDefinition } from "../../../types";

export const Skill_0345: SkillDefinition = {
  id: 345,
  code: "DL_0345",
  name: "Sonic Rage",
  description: "Dual Swords attack that emits a beam to strike a distant target while gathering force for use in other special attack skills. Force can be gathered up to level 7. Critical attack is possible. Usable when one is equipped with a dual-sword type weapon.\n\nАтака парными мечами, которая выпускает луч для удара по дальним целям, одновременно собирая силу для использования в других специальных атакующих скілах. Сила может быть собрана до 7 уровня. Возможна критическая атака. Используется при экипировке парных мечей.",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  cooldown: 8,
  icon: "/skills/0345.jpg",
  levels: [
    { level: 1, requiredLevel: 78, spCost: 16000000, mpCost: 5, power: 7 },
  ],
};

