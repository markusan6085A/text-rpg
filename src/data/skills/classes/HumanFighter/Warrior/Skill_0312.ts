import { SkillDefinition } from "../../../types";

export const Skill_0312: SkillDefinition = {
  id: 312,
  code: "WR_0312",
  name: "Vicious Stance",
  description: "Increases one's critical attack power. MP will be consumed continuously.\n\nУвеличивает силу критической атаки. MP потребляется непрерывно.",
  category: "toggle",
  powerType: "flat",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: -4, // Споживає MP кожні 3 секунди (базове значення, може змінюватися залежно від рівня)
  tickInterval: 3,
  stackType: "vicious_stance",
  stackOrder: 1,
  effects: [
    { stat: "critRate", mode: "percent" },
    { stat: "critDamage", mode: "percent" },
  ],
  icon: "/skills/0312.jpg",
  levels: [
    { level: 1, requiredLevel: 20, spCost: 3700, mpCost: 4, power: 35 },
    { level: 2, requiredLevel: 24, spCost: 6400, mpCost: 5, power: 48 },
    { level: 3, requiredLevel: 28, spCost: 12000, mpCost: 5, power: 64 },
    { level: 4, requiredLevel: 32, spCost: 18000, mpCost: 6, power: 84 },
    { level: 5, requiredLevel: 36, spCost: 31000, mpCost: 7, power: 109 },
  ],
};

