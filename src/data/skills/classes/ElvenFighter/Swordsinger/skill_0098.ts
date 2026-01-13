import { SkillDefinition } from "../../../types";

// Sword Symphony - used to inflict damage to surrounding enemies while fleeing
export const skill_0098: SkillDefinition = {
  id: 98,
  code: "SS_0098",
  name: "Sword Symphony",
  description: "Used to inflict damage to surrounding enemies while fleeing.\n\nИспользуется для нанесения урона окружающим врагам во время бегства. Наносит урон и вызывает страх на 15%.",
  icon: "/skills/skill0098.gif",
  category: "physical_attack",
  powerType: "damage",
  target: "enemy",
  scope: "area",
  castTime: 2,
  cooldown: 60,
  chance: 15, // Fear chance
  levels: [
    { level: 1, requiredLevel: 55, spCost: 270000, mpCost: 120, power: 229 },
    { level: 2, requiredLevel: 60, spCost: 410000, mpCost: 133, power: 284 },
    { level: 3, requiredLevel: 64, spCost: 690000, mpCost: 142, power: 321 },
    { level: 4, requiredLevel: 68, spCost: 1300000, mpCost: 152, power: 382 },
    { level: 5, requiredLevel: 72, spCost: 2200000, mpCost: 160, power: 432 },
  ],
};

