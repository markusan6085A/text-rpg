import { SkillDefinition } from "../../../types";

// Whirlwind Attack - toggle skill that deals cleave damage
// When active, basic attacks also hit 3 additional nearby mobs for 50% damage
export const skill_0348: SkillDefinition = {
  id: 348,
  code: "FS_0348",
  name: "Whirlwind Attack",
  description: "When active, your basic attacks also hit up to 3 additional nearby enemies for 50% of base damage. Continuously consumes MP.\n\nКогда активно, ваши базовые атаки также поражают до 3 дополнительных ближайших врагов на 50% от базового урона. Непрерывно потребляет MP (20 MP каждую секунду).",
  icon: "/skills/skill0348.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: -20, // Consumes 20 MP per second
  tickInterval: 1,
  levels: [
    { level: 1, requiredLevel: 76, spCost: 10000000, mpCost: 0, power: 0 },
  ],
};

