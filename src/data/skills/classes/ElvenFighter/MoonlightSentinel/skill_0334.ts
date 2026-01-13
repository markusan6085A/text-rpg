import { SkillDefinition } from "../../../types";

// Focus Skill Mastery - increases skill success rate significantly, MP consumed continuously
export const skill_0334: SkillDefinition = {
  id: 334,
  code: "MS_0334",
  name: "Focus Skill Mastery",
  description: "Increases skill success rate significantly. MP will be consumed continuously.\n\nЗначительно увеличивает шанс успеха навыков Skill Critical на 10 раз. Непрерывно расходует MP (1 MP/сек, 5 MP/сек).",
  icon: "/skills/skill0334.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: 1, // Continuous MP consumption (5 MP/sec)
  tickInterval: 1,
  effects: [
    {
      stat: "skillMastery",
      mode: "multiplier",
      value: 10, // Increases skill critical chance by 10x
    },
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 36, power: 0 },
  ],
};

