import { SkillDefinition } from "../../../types";

export const Skill_0312: SkillDefinition = {
  id: 312,
  code: "OR_0312",
  name: "Vicious Stance",
  description: "Increases one's critical attack power. MP will be consumed continuously.\n\nУвеличивает силу критической атаки. MP будет постоянно потребляться.",
  icon: "/skills/skill0312.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: 0.4,
  effects: [
    { stat: "critDamage", mode: "flat" },
  ],
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3400, mpCost: 4, power: 35 },
    { level: 2, requiredLevel: 24, spCost: 5300, mpCost: 5, power: 48 },
    { level: 3, requiredLevel: 28, spCost: 11000, mpCost: 5, power: 64 },
    { level: 4, requiredLevel: 32, spCost: 17000, mpCost: 6, power: 84 },
    { level: 5, requiredLevel: 36, spCost: 17000, mpCost: 7, power: 109 },
  ],
};

