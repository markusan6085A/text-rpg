import { SkillDefinition } from "../../../types";

// Demon Wind
export const skill_1291: SkillDefinition = {
  id: 1291,
  code: "SS_1291",
  name: "Demon Wind",
  description: "Requires 2 Wind Seeds. Attacks with wind and decreases target's HP recovery. Power 350. Effect 2.\n\nТребует 2 Семени Ветра. Атакует ветром и снижает восстановление HP цели. Сила 350. Снижает восстановление HP на 50% на 120 сек.",
  icon: "/skills/skill1291.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "wind",
  target: "enemy",
  scope: "single",
  castTime: 7,
  cooldown: 3600, // 1 hour reuse
  duration: 120,
  effects: [{ stat: "hpRegen", mode: "multiplier", multiplier: 0.5 }],
  levels: [
    { level: 1, requiredLevel: 70, spCost: 10000000, mpCost: 250, power: 350.0 },
  ],
};

