import { SkillDefinition } from "../../../types";

// Mental Shield - temporarily increases resistance to Hold, Sleep, Fear, and Mental attacks
// З XML: levels="4", mpConsume: 18-41
// Для Elven Oracle: рівень 1 (requiredLevel: 25)
export const skill_1035: SkillDefinition = {
  id: 1035,
  code: "EO_1035",
  name: "Mental Shield",
  description: "Temporarily increases resistance to Hold, Sleep, Fear, and Mental attacks. Enchant Time: the skill duration is increased. Effect 1.\n\nВременно увеличивает сопротивление к удержанию, сну, страху и ментальным атакам. Увеличивает сопротивление на 20% (зависит от уровня). Длительность: 20 мин. Каст: 4 сек. Перезарядка: 6 сек.",
  icon: "/skills/skill1035.gif",
  category: "buff",
  powerType: "none",
  target: "ally",
  scope: "single",
  duration: 1200,
  castTime: 4,
  cooldown: 6,
  effects: [
    { stat: "holdResist", mode: "percent", value: 20 },
    { stat: "sleepResist", mode: "percent", value: 20 },
    { stat: "fearResist", mode: "percent", value: 20 },
    { stat: "mentalResist", mode: "percent", value: 20 },
  ],
  levels: [
    { level: 1, requiredLevel: 25, spCost: 6500, mpCost: 18, power: 0 },
  ],
};

