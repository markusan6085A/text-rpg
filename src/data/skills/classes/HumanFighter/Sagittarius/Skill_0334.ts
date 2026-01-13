import { SkillDefinition } from "../../../types";

export const Skill_0334: SkillDefinition = {
  id: 334,
  code: "HF_0334",
  name: "Focus Skill Mastery",
  description: "Increases skill success rate significantly. MP will be consumed continuously.\n\nЗначительно увеличивает шанс успеха навыков. MP будет потребляться непрерывно.",
  icon: "/skills/skill0334.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: 50, // 50 MP/сек
  tickInterval: 1,
  effects: [
    {
      "stat": "skillMastery",
      "mode": "multiplier",
      "value": 10
    }
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 64000000, mpCost: 36, power: 0 },
  ],
};

