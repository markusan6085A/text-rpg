import { SkillDefinition } from "../../../types";

export const skill_1285: SkillDefinition = {
  id: 1285,
  code: "HM_1285",
  name: "Seed of Fire",
  description: "Instills the force of fire. Unless a new force is instilled in 5 seconds, all forces will disappear. Эффект Seed of Fire, кастуется на членов магической связки, действует в пределах дальности 600: - Использует магическую связку.",
  icon: "/skills/skill1285.gif",
  category: "magic_attack",
  powerType: "damage",
  target: "enemy",
  scope: "single",
  castTime: 4,
  cooldown: 3600,
  levels: [
  {
    "level": 1,
    "requiredLevel": 66,
    "spCost": 410000,
    "mpCost": 250,
    "power": 0
  }
]
};
