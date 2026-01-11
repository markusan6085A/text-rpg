import { SkillDefinition } from "../../../types";

// Inferno
export const skill_1289: SkillDefinition = {
  id: 1289,
  code: "SS_1289",
  name: "Inferno",
  description: "Requires 2 Fire Seeds. Attacks with fire and deals damage over time. Power 350.\n\nТребует 2 Семени Огня. Атакует огнем и наносит урон со временем. Сила 350. Наносит урон огнем на 20 сек. (118 HP раз в 1 сек).",
  icon: "/skills/skill1289.gif",
  category: "magic_attack",
  powerType: "damage",
  element: "fire",
  target: "enemy",
  scope: "single",
  castTime: 7,
  cooldown: 3600, // 1 hour reuse
  duration: 20,
  hpPerTick: 0, // Will be set from level.power (negative value for damage)
  tickInterval: 1,
  levels: [
    { level: 1, requiredLevel: 70, spCost: 10000000, mpCost: 250, power: -118 }, // Negative for DOT
  ],
};

