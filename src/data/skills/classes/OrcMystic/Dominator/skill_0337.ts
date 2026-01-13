import { SkillDefinition } from "../../../types";

// Arcane Power - toggle skill that significantly increases M. Atk. power, but at an increased MP cost per skill. HP will be continuously consumed while in effect.
export const skill_0337: SkillDefinition = {
  id: 337,
  code: "DOM_0337",
  name: "Arcane Power",
  description: "Significantly increases M. Atk. power, but at an increased MP cost per skill. HP will be continuously consumed while in effect.\n\nЗначительно увеличивает силу магической атаки, но увеличивает стоимость MP за навык. HP будет непрерывно потребляться во время действия.\n\n- Увеличивает магическую атаку на 30%.\n- Увеличивает стоимость MP за навык на 10%.\n- Потребляет 50 HP каждую секунду.",
  icon: "/skills/skill0337.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  hpPerTick: -50, // Consumes 50 HP per tick
  tickInterval: 1, // Every 1 second
  effects: [
    { stat: "mAtk", mode: "multiplier", multiplier: 1.3 }, // 30% increase = 1.3 multiplier
    // Note: MP cost increase is handled in skill application logic (MagicalMpConsumeRate in XML)
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 36, power: 30 },
  ],
};

