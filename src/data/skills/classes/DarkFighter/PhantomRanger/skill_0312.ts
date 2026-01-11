import { SkillDefinition } from "../../../types";

// Vicious Stance - increases critical attack power, consumes MP continuously (continuation from Assassin lv.6-20)
export const skill_0312: SkillDefinition = {
  id: 312,
  code: "PR_0312",
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
    { level: 6, requiredLevel: 40, spCost: 33000, mpCost: 7, power: 139 },
    { level: 7, requiredLevel: 43, spCost: 33000, mpCost: 8, power: 166 },
    { level: 8, requiredLevel: 46, spCost: 47000, mpCost: 9, power: 196 },
    { level: 9, requiredLevel: 49, spCost: 75000, mpCost: 9, power: 229 },
    { level: 10, requiredLevel: 52, spCost: 120000, mpCost: 10, power: 266 },
    { level: 11, requiredLevel: 55, spCost: 170000, mpCost: 10, power: 306 },
    { level: 12, requiredLevel: 58, spCost: 180000, mpCost: 11, power: 349 },
    { level: 13, requiredLevel: 60, spCost: 240000, mpCost: 11, power: 379 },
    { level: 14, requiredLevel: 62, spCost: 310000, mpCost: 12, power: 410 },
    { level: 15, requiredLevel: 64, spCost: 370000, mpCost: 12, power: 443 },
    { level: 16, requiredLevel: 66, spCost: 500000, mpCost: 13, power: 475 },
    { level: 17, requiredLevel: 68, spCost: 600000, mpCost: 13, power: 509 },
    { level: 18, requiredLevel: 70, spCost: 720000, mpCost: 13, power: 542 },
    { level: 19, requiredLevel: 72, spCost: 1200000, mpCost: 14, power: 576 },
    { level: 20, requiredLevel: 74, spCost: 1600000, mpCost: 14, power: 610 },
  ],
};

