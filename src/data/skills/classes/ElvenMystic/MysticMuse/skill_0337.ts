import { SkillDefinition } from "../../../types";

// Arcane Power - toggle skill that significantly increases M. Atk. power, but at an increased MP cost per skill. HP will be continuously consumed while in effect.
export const skill_0337: SkillDefinition = {
  id: 337,
  code: "MM_0337",
  name: "Arcane Power",
  description: "Significantly increases M. Atk. power, but at an increased MP cost per skill. HP will be continuously consumed while in effect.\n\nЗначительно увеличивает силу магической атаки на 30%, но увеличивает стоимость MP за навык на 10%. Потребляет 250 HP каждые 5 сек.",
  icon: "/skills/skill0337.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  hpPerTick: -250, // Consumes 250 HP per tick
  tickInterval: 5, // Every 5 seconds
  effects: [
    { stat: "mAtk", mode: "percent", value: 30 },
    // MP cost increase (10%) is handled by game logic
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 36, power: 0 },
  ],
};

