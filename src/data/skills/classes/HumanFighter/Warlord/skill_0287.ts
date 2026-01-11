import { SkillDefinition } from "../../../types";

export const skill_0287: SkillDefinition = {
  id: 287,
  code: "WL_0287",
  name: "Lionheart",
  description: "Temporarily and significantly increases resistance to Paralysis, Hold, Sleep or Shock attack.\n\nВременно и значительно увеличивает сопротивление к параличу, удержанию, сну и шоку на 40-80% (зависит от уровня) на 60 сек. Также снижает уязвимость к снятию бафов на 10%. Каст: 1.5 сек. Перезарядка: 15 мин.",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 1.5,
  cooldown: 900,
  duration: 60,
  icon: "/skills/skill0287.gif",
  levels: [
    { level: 2, requiredLevel: 49, spCost: 89000, mpCost: 44, power: 0 },
    { level: 3, requiredLevel: 62, spCost: 400000, mpCost: 58, power: 0 },
  ],
};

