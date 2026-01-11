import { SkillDefinition } from "../../../types";

// Aura Flare - attacks a target touching the caster
// Note: ID 1231 is used for Surrender To Earth in Elven Wizard, but for Aura Flare in Spellsinger
// This is a different skill, so we use the same ID 1231 but different code
export const skill_1231_flare: SkillDefinition = {
  id: 1231,
  code: "ES_1231_FLARE",
  name: "Aura Flare",
  description: "Attacks a target that is touching the caster. Power 39-79.\n\nАтакует цель, касающуюся кастера. Сила 39-79.",
  icon: "/skills/skill1231.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 2.5,
  duration: 3,
  levels: [
    { level: 1, requiredLevel: 40, spCost: 14000, mpCost: 34, power: 39 },
    { level: 2, requiredLevel: 40, spCost: 14000, mpCost: 35, power: 42 },
    { level: 3, requiredLevel: 44, spCost: 18000, mpCost: 38, power: 44 },
    { level: 4, requiredLevel: 44, spCost: 18000, mpCost: 39, power: 47 },
    { level: 5, requiredLevel: 48, spCost: 30000, mpCost: 42, power: 49 },
    { level: 6, requiredLevel: 48, spCost: 30000, mpCost: 44, power: 52 },
    { level: 7, requiredLevel: 52, spCost: 47000, mpCost: 45, power: 55 },
    { level: 8, requiredLevel: 52, spCost: 47000, mpCost: 48, power: 57 },
    { level: 9, requiredLevel: 56, spCost: 48000, mpCost: 49, power: 60 },
    { level: 10, requiredLevel: 56, spCost: 48000, mpCost: 52, power: 63 },
    { level: 11, requiredLevel: 58, spCost: 61000, mpCost: 53, power: 64 },
    { level: 12, requiredLevel: 58, spCost: 61000, mpCost: 54, power: 66 },
    { level: 13, requiredLevel: 60, spCost: 75000, mpCost: 55, power: 67 },
    { level: 14, requiredLevel: 60, spCost: 75000, mpCost: 56, power: 69 },
    { level: 15, requiredLevel: 62, spCost: 120000, mpCost: 57, power: 70 },
    { level: 16, requiredLevel: 62, spCost: 120000, mpCost: 58, power: 72 },
    { level: 17, requiredLevel: 64, spCost: 150000, mpCost: 59, power: 73 },
    { level: 18, requiredLevel: 64, spCost: 150000, mpCost: 60, power: 75 },
    { level: 19, requiredLevel: 66, spCost: 190000, mpCost: 61, power: 76 },
    { level: 20, requiredLevel: 66, spCost: 190000, mpCost: 62, power: 77 },
    { level: 21, requiredLevel: 68, spCost: 390000, mpCost: 64, power: 79 },
  ],
};

