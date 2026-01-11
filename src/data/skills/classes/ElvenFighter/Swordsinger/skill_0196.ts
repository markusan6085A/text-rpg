import { SkillDefinition } from "../../../types";

// Holy Blade - ability to attack with sacred power
export const skill_0196: SkillDefinition = {
  id: 196,
  code: "SS_0196",
  name: "Holy Blade",
  description: "Ability to attack with sacred power.\n\nСпособность атаковать священной силой. Увеличивает урон по Undead на 30%.",
  icon: "/skills/skill0196.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: -8, // Consumes 8 MP per tick
  tickInterval: 5, // Every 5 seconds
  effects: [
    { stat: "pAtk", mode: "multiplier", multiplier: 1.3 }, // 30% increase vs Undead
  ],
  levels: [
    { level: 1, requiredLevel: 43, spCost: 53000, mpCost: 8, power: 0 },
  ],
};

