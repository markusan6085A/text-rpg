import { SkillDefinition } from "../../../types";

// Elemental Assault
export const skill_1292: SkillDefinition = {
  id: 1292,
  code: "SS_1292",
  name: "Elemental Assault",
  description: "Requires Water Seed and Wind Seed. Attacks with a powerful magic spell. Power 500. Can cause Over-hit.\n\nТребует Семя Воды и Семя Ветра. Атакует мощным магическим заклинанием. Сила 500. Может вызвать Over-hit.",
  icon: "/skills/skill1292.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 7,
  cooldown: 3600, // 1 hour reuse
  levels: [
    { level: 1, requiredLevel: 72, spCost: 10000000, mpCost: 250, power: 500.0 },
  ],
};

