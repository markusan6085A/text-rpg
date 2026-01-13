import { SkillDefinition } from "../../../types";

// Warrior Servitor
export const skill_1346: SkillDefinition = {
  id: 1346,
  code: "AL_1346",
  name: "Warrior Enhancement",
  description: "The spirit of an ancient warrior takes possession of the servitor for a certain period of time. Consumes 10 spirit ores.\n\nДух древнего воина овладевает сервитором на определенный период времени. Потребляет 10 духовых руд. Увеличивает HP на 20%, реген HP на 20%, физ. защиту на 20%, точность на 4, физ. атаку на 10%, скорость атаки на 20%, сопротивление дебафам на 10%. Уменьшает скорость бега на 10%.",
  category: "buff",
  powerType: "none",
  icon: "/skills/Skill1346.jpg",
  target: "ally",
  scope: "single",
  duration: 300,
  effects: [
    { stat: "maxHp", mode: "percent", value: 20 },
    { stat: "hpRegen", mode: "percent", value: 20 },
    { stat: "pDef", mode: "percent", value: 20 },
    { stat: "accuracy", mode: "flat", value: 4 },
    { stat: "pAtk", mode: "percent", value: 10 },
    { stat: "runSpeed", mode: "percent", value: -10 },
    { stat: "atkSpeed", mode: "percent", value: 20 },
    { stat: "debuffResist", mode: "percent", value: 10 },
  ],
  levels: [{ level: 1, requiredLevel: 77, spCost: 15000000, mpCost: 70, power: 0 }],
};

