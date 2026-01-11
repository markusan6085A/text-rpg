import { SkillDefinition } from "../../../types";

// Seed of Water - instills the force of water
export const skill_1297: SkillDefinition = {
  id: 1297,
  code: "ES_1297",
  name: "Seed of Water",
  description: "Instills the force of water. Unless a new force is instilled in 5 seconds, all forces will disappear.\n\nВселяет силу воды. Если новая сила не вселена в течение 5 секунд, все силы исчезнут.",
  icon: "/skills/skill1297.gif",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 3600,
  duration: 5,
  levels: [
    { level: 1, requiredLevel: 66, spCost: 350000, mpCost: 250, power: 0 },
  ],
};

