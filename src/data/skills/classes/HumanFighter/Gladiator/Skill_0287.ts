import { SkillDefinition } from "../../../types";

// Lionheart    , ,    .
export const Skill_0287: SkillDefinition = {
  id: 287,
  code: "GL_0287",
  name: "Lionheart",
  description: "Temporarily and significantly increases resistance to Paralysis, Hold, Sleep or Shock attack.\n\nВременно и значительно увеличивает сопротивление к параличу, удержанию, сну и шоку на 40-80% (зависит от уровня) на 60 сек. Также снижает уязвимость к снятию бафов на 10%. Каст: 1.5 сек. Перезарядка: 15 мин.",
  category: "buff",
  powerType: "percent",
  target: "self",
  scope: "single",
  duration: 60,
  cooldown: 150,
  icon: "/skills/0287.jpg",
  effects: [
    { stat: "stunResist", mode: "percent" },
    { stat: "sleepResist", mode: "percent" },
    { stat: "holdResist", mode: "percent" },
    { stat: "mentalResist", mode: "percent" },
  ],
  levels: [
    { level: 1, requiredLevel: 49, spCost: 61000, mpCost: 22, power: 60 },
    { level: 2, requiredLevel: 58, spCost: 153000, mpCost: 29, power: 80 },
  ],
};

