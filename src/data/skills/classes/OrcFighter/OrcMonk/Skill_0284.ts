import { SkillDefinition } from "../../../types";

export const Skill_0284: SkillDefinition = {
  id: 284,
  code: "OM_0284",
  name: "Hurricane Assault",
  description: "A flurry of combat strikes. Used with hand-to-hand combat equipment. A charged force of Level 2 is required.\n\nШквал боевых ударов. Используется с оружием для рукопашного боя. Требуется заряженная сила уровня 2.",
  icon: "/skills/skill0284.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.36,
  cooldown: 17,
  effects: [],
  levels: [
    { level: 1, requiredLevel: 36, spCost: 13000, mpCost: 49, power: 501 },
    { level: 2, requiredLevel: 36, spCost: 13000, mpCost: 50, power: 535 },
    { level: 3, requiredLevel: 36, spCost: 13000, mpCost: 52, power: 570 },
  ],
};

