import { SkillDefinition } from "../../../types";

// Reflect Damage для DarkAvenger (рівні 1-3)
export const skill_0086: SkillDefinition = {
  id: 86,
  code: "DAV_0086",
  name: "Reflect Damage",
  description: "Temporarily reflects damage back upon the enemy excluding damage from skill or remote attack. Effect 1.\n\nВременно отражает 10-20% входящего урона обратно на врага (исключая урон от навыков или дальних атак). Длительность: 20 сек. Каст: 4 сек. Перезарядка: 6 сек.",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  castTime: 4,
  cooldown: 6,
  duration: 20,
  icon: "/skills/skill0086.gif",
  effects: [
    { stat: "reflect", mode: "percent", duration: 20 }, // Value will be taken from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 40, spCost: 33000, mpCost: 35, power: 10 },
    { level: 2, requiredLevel: 46, spCost: 47000, mpCost: 42, power: 15 },
    { level: 3, requiredLevel: 52, spCost: 120000, mpCost: 48, power: 20 },
  ],
};

