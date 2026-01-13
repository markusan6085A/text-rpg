import { SkillDefinition } from "../../../types";

// Transfer Pain - Transfers part of one's damage to a servitor. MP will be consumed continuously.
export const skill_1262: SkillDefinition = {
  id: 1262,
  code: "ES_1262",
  name: "Transfer Pain",
  description: "Transfers part of one's damage to a servitor. MP will be consumed continuously.\n\nЭффект:\n- Передает 10% урона на сервитора.\n- Расходует 0.2 (0.2?) MP, каждые 5 секунд (около 5 MP/сек).",
  icon: "/skills/skill1262.gif",
  category: "toggle",
  toggle: true,
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 0,
  cooldown: 0,
  duration: 0,
  mpPerTick: 1, // 0.2 MP per tick, 5 ticks per second = 1 MP/sec
  tickInterval: 0.2, // Every 0.2 seconds (5 times per second)
  effects: [], // Transfer pain is handled by game logic, not by stat modifiers
  levels: [
    { level: 1, requiredLevel: 40, spCost: 32000, mpCost: 7, power: 10 },
    { level: 2, requiredLevel: 48, spCost: 67000, mpCost: 9, power: 20 },
    { level: 3, requiredLevel: 56, spCost: 110000, mpCost: 11, power: 30 },
    { level: 4, requiredLevel: 58, spCost: 180000, mpCost: 11, power: 40 },
    { level: 5, requiredLevel: 70, spCost: 670000, mpCost: 13, power: 50 },
  ],
};

