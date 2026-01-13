import { SkillDefinition } from "../../../types";

export const skill_0339: SkillDefinition = {
  id: 339,
  code: "DN_0339",
  name: "Parry Stance",
  description: "Uses weapon to block incoming attacks. P. Def and M.Def increase significantly. Speed, Atk. Spd. and accuracy are decreased. MP will be continuously consumed while in effect.\n\nИспользует оружие для блокировки входящих атак. Увеличивает физ. защиту и маг. защиту на 25%. Снижает скорость движения на 10%, скорость атаки на 20% и точность на 4. Непрерывно потребляет MP (36 MP каждые 3 сек). Переключаемый навык.",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  icon: "/skills/skill0339.gif",
  toggle: true,
  castTime: 0,
  cooldown: 0,
  duration: 0, // Toggle skill - infinite duration
  tickInterval: 1, // MP consumed every 1 second
  mpPerTick: -5, // Consumes 5 MP per second
  effects: [
    { stat: "pDef", mode: "percent", value: 25 }, // +25% P. Def
    { stat: "mDef", mode: "percent", value: 25 }, // +25% M. Def
    { stat: "atkSpeed", mode: "percent", value: -20 }, // -20% Attack Speed
    { stat: "accuracy", mode: "flat", value: -4 }, // -4 Accuracy
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 21000000, mpCost: 36, power: 0 },
  ],
};

