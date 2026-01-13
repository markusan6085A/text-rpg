import { SkillDefinition } from "../../../types";

// Vicious Stance - increases critical attack power, consumes MP continuously
export const skill_0312: SkillDefinition = {
  id: 312,
  code: "AS_0312",
  name: "Vicious Stance",
  description: "Increases one's critical attack power. MP will be consumed continuously.\n\nУвеличивает силу критической атаки. MP будет расходоваться непрерывно.",
  icon: "/skills/skill0312.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: 0.4, // Continuous MP consumption (5 MP/sec)
  effects: [
    { stat: "critDamage", mode: "flat" }, // Value from level.power
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 2800, mpCost: 4, power: 35 },
    { level: 2, requiredLevel: 24, spCost: 5000, mpCost: 5, power: 48 },
    { level: 3, requiredLevel: 28, spCost: 8500, mpCost: 5, power: 64 },
    { level: 4, requiredLevel: 32, spCost: 14000, mpCost: 6, power: 84 },
    { level: 5, requiredLevel: 36, spCost: 22000, mpCost: 7, power: 109 },
  ],
};

