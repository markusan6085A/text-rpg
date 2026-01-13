import { SkillDefinition } from "../../../types";

// War Frenzy    / ().
export const Skill_0424: SkillDefinition = {
  id: 424,
  code: "GL_0424",
  name: "War Frenzy",
  description: "Increases your resistance to stun and sleep. MP is continuously consumed while the effect lasts.\n\nУвеличивает сопротивление к оглушению на 5-15% и ко сну на 10-30% (зависит от уровня). Непрерывно потребляет MP (11-14 MP каждые 3 сек). Переключаемый навык.",
  category: "toggle",
  powerType: "percent",
  target: "self",
  scope: "single",
  icon: "/skills/0424.jpg",
  effects: [
    { stat: "stunResist", mode: "percent" },
    { stat: "sleepResist", mode: "percent" },
  ],
  levels: [
    { level: 1, requiredLevel: 58, spCost: 153000, mpCost: 11, power: 5 },
    { level: 2, requiredLevel: 66, spCost: 440000, mpCost: 13, power: 10 },
    { level: 3, requiredLevel: 74, spCost: 1630000, mpCost: 14, power: 15 },
  ],
};

