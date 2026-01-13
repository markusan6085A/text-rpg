import { SkillDefinition } from "../../../types";

// Vengeance для HellKnight (рівень 1)
export const skill_0368: SkillDefinition = {
  id: 368,
  code: "HKN_0368",
  name: "Vengeance",
  description: "Instantly increases resistance to P. Def/M. Def buff-lifting attacks. Provokes nearby enemies to target the caster. The caster is immobile for the skill's duration. Usable when equipped with a shield.\n\nМгновенно увеличивает физ. защиту на 5400 и маг. защиту на 4050 на 30 сек. Провоцирует врагов в радиусе 200 атаковать только вас. Делает неподвижным на время действия. Снижает уязвимость к снятию бафов на 80%. Каст: 1 сек. Перезарядка: 30 мин. Требуется щит.",
  category: "buff",
  powerType: "flat",
  target: "self",
  scope: "area", // Провокація в радіусі 200
  castTime: 1,
  cooldown: 1800, // 30 хвилин
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
    { level: 1, requiredLevel: 77, spCost: 20000000, mpCost: 35, power: 3994 },
  ],
};

