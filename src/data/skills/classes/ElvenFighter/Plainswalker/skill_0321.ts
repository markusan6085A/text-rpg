import { SkillDefinition } from "../../../types";

// Blinding Blow - increases attack speed while launching potentially deadly attack
export const skill_0321: SkillDefinition = {
  id: 321,
  code: "PW_0321",
  name: "Blinding Blow",
  description: "Increases attack speed while launching a potentially deadly attack. Usable when a dagger is equipped.\n\nУвеличивает скорость атаки на 40 на 10 сек. Сила 2751-3653 (зависит от уровня). Требуется кинжал. Возможен летальный удар.",
  icon: "/skills/skill0321.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.08,
  cooldown: 180,
  duration: 10,
  effects: [
    { stat: "attackSpeed", mode: "flat", value: 40, duration: 10 },
  ],
  levels: [
    { level: 1, requiredLevel: 66, spCost: 320000, mpCost: 133, power: 2751 },
    { level: 2, requiredLevel: 66, spCost: 320000, mpCost: 135, power: 2850 },
    { level: 3, requiredLevel: 68, spCost: 330000, mpCost: 137, power: 2950 },
    { level: 4, requiredLevel: 68, spCost: 330000, mpCost: 139, power: 3050 },
    { level: 5, requiredLevel: 70, spCost: 420000, mpCost: 141, power: 3151 },
    { level: 6, requiredLevel: 70, spCost: 420000, mpCost: 143, power: 3252 },
    { level: 7, requiredLevel: 72, spCost: 680000, mpCost: 145, power: 3353 },
    { level: 8, requiredLevel: 72, spCost: 680000, mpCost: 147, power: 3453 },
    { level: 9, requiredLevel: 74, spCost: 1000000, mpCost: 149, power: 3553 },
    { level: 10, requiredLevel: 74, spCost: 1000000, mpCost: 151, power: 3653 },
  ],
};

