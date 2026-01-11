import { SkillDefinition } from "../../../types";

// Focus Skill Mastery - increases skill success rate significantly
export const skill_0334: SkillDefinition = {
  id: 334,
  code: "GS_0334",
  name: "Focus Skill Mastery",
  description: "Increases skill success rate significantly. MP will be consumed continuously.\n\nЗначительно увеличивает успешность навыков. MP будет расходоваться непрерывно. Уровень 1: 1 MP, расходуется каждые 5 секунд (5 MP/сек). Увеличивает Skill Critical на 10 сек.",
  icon: "/skills/skill0334.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: 1, // 1 MP per tick (5 MP/sec)
  tickInterval: 5, // Every 5 seconds
  effects: [
    {
      "stat": "skillMastery",
      "mode": "multiplier",
      "multiplier": 10
    }
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 36, power: 0 },
  ],
};

