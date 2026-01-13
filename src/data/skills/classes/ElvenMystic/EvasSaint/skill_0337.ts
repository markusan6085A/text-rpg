import { SkillDefinition } from "../../../types";

// Arcane Power
export const skill_0337: SkillDefinition = {
  id: 337,
  code: "ES_0337",
  name: "Arcane Power",
  description: "Significantly increases M. Atk. power, but at an increased MP cost per skill. HP will be continuously consumed while in effect.\n\nЗначительно увеличивает магическую атаку на 30%, но увеличивает расход MP на магию на 10%. Расходует по 250 HP раз в 5 сек.",
  icon: "/skills/skill0337.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 0,
  cooldown: 0,
  duration: 0,
  toggle: true,
  hpPerTick: 250, // 250 HP every 5 seconds
  tickInterval: 5,
  effects: [
    { stat: "mAtk", mode: "multiplier", multiplier: 1.3 }, // +30% M. Atk
    // MagicalMpConsumeRate 1.1 = +10% MP consumption (handled by game logic)
  ],
  stackType: "arcane_power",
  stackOrder: 1,
  levels: [
    {
      level: 1,
      requiredLevel: 78,
      spCost: 32000000,
      mpCost: 36,
      power: 0,
    },
  ],
};

