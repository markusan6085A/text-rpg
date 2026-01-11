import { SkillDefinition } from "../../../types";

// Mental Shield - temporarily increases resistance to Hold, Sleep, Fear, and Mental attacks (continuation for Elven Elder)
// З XML: levels="4", mpConsume: 18-41
// Для Elven Elder: рівні 2-4 (requiredLevel: 40-56)
export const skill_1035: SkillDefinition = {
  id: 1035,
  code: "EE_1035",
  name: "Mental Shield",
  description: "Temporarily increases resistance to Hold, Sleep, Fear, and Mental attacks. Enchant Time: the duration of one's skill usage is increased. Effect 2.\n\nВременно увеличивает сопротивление к удержанию, сну, страху и ментальным атакам на 60-80% (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1035.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "holdResist", mode: "percent" },
    { stat: "sleepResist", mode: "percent" },
    { stat: "fearResist", mode: "percent" },
    { stat: "mentalResist", mode: "percent" },
  ],
  levels: [
    { level: 2, requiredLevel: 40, spCost: 34000, mpCost: 35, power: 60 },
    { level: 3, requiredLevel: 48, spCost: 67000, mpCost: 44, power: 70 },
    { level: 4, requiredLevel: 56, spCost: 110000, mpCost: 52, power: 80 },
  ],
};













