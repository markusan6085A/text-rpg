import { SkillDefinition } from "../../../types";

// Vengeance для PhoenixKnight (рівень 1)
export const skill_0368: SkillDefinition = {
  id: 368,
  code: "PKN_0368",
  name: "Vengeance",
  description: "Instantly increases P. Def, M.Def and provokes nearby enemies' desire to attack. Transfers the target's status to oneself. Becomes immobile while skill is in effect. Available while one is being equipped with a shield.\n\nМгновенно увеличивает физ. защиту на 5400 и маг. защиту на 4050 на 30 сек. Провоцирует врагов в радиусе 200 атаковать только вас. Делает неподвижным на время действия. Снижает уязвимость к снятию бафов на 80%. Каст: 1 сек. Перезарядка: 8 мин. Требуется щит.",
  category: "buff",
  powerType: "flat",
  target: "self",
  scope: "area", // Провокація в радіусі 200
  castTime: 1,
  cooldown: 480, // 8 хвилин
  duration: 30,
  icon: "/skills/skill0368.gif",
  effects: [
    { stat: "pDef", mode: "flat", value: 5400, duration: 30 },
    { stat: "mDef", mode: "flat", value: 4050, duration: 30 },
    { stat: "cancelResist", mode: "percent", value: 80, duration: 30 }, // Зменшує вразливість до зняття бафів на 80%
    { stat: "immobile", mode: "flat", duration: 30 }, // Робить нездатним рухатися
    { stat: "taunt", mode: "flat", value: 100, duration: 30 }, // Провокація: моб атакує лише цього героя (100% агро)
  ],
  levels: [
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 105, power: 3994 },
  ],
};

