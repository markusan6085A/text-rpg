import { SkillDefinition } from "../../../types";

// Lure - quietly lures an enemy
export const skill_0051: SkillDefinition = {
  id: 51,
  code: "PW_0051",
  name: "Lure",
  description: "Quietly lures an enemy.\n\nТихо привлекает врага. Увеличивает агрессию врага на 500 на 60 сек.",
  icon: "/skills/skill0051.gif",
  category: "special",
  powerType: "none",
  target: "enemy",
  scope: "single",
  castTime: 1.5,
  cooldown: 10,
  duration: 60,
  // Lure increases enemy aggression - handled by game logic, not by stat modifiers
  effects: [],
  levels: [
    { level: 1, requiredLevel: 52, spCost: 120000, mpCost: 44, power: 500 },
  ],
};

