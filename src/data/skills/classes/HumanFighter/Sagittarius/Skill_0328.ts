import { SkillDefinition } from "../../../types";

export const Skill_0328: SkillDefinition = {
  id: 328,
  code: "HF_0328",
  name: "Wisdom",
  description: "Increases resistance to Hold, Sleep, and Mental attacks.\n\nУвеличивает сопротивление к Hold, Sleep и Mental атакам.",
  icon: "/skills/skill0328.gif",
  category: "passive",
  powerType: "none",
  target: "self",
  scope: "single",
  effects: [
    {
      "stat": "holdResist",
      "mode": "multiplier",
      "value": 0.8
    },
    {
      "stat": "sleepResist",
      "mode": "multiplier",
      "value": 0.8
    },
    {
      "stat": "mentalResist",
      "mode": "multiplier",
      "value": 0.8
    }
  ],
  levels: [
    { level: 1, requiredLevel: 76, spCost: 15000000, mpCost: 0, power: 0 },
  ],
};

