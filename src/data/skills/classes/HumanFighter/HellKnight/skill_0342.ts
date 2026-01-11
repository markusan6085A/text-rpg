import { SkillDefinition } from "../../../types";

// Touch of Death для HellKnight (рівень 1)
export const skill_0342: SkillDefinition = {
  id: 342,
  code: "HKN_0342",
  name: "Touch of Death",
  description: "Sacrifices HP to cast a dark curse upon an enemy that has a chance to remove multiple buffs and significantly decrease maximum CP for a brief time. Decreases resistance to debuff attacks and the effectiveness of HP regeneration magic. Only usable when HP is 75% or lower.\n\nЖертвует HP для наложения темного проклятия на врага, которое имеет шанс снять несколько бафов и значительно уменьшить максимальный CP на короткое время. Уменьшает сопротивление к дебафам и эффективность магии восстановления HP. Можно использовать только когда HP 75% или ниже. Снимает до 5 бафов. Уменьшает максимальный CP до 10% на 2 мин. Увеличивает уязвимость к дебафам на 30%. Уменьшает эффективность восстановления HP на 30%. Потребляет 1004 HP. Каст: 1.8 сек. Перезарядка: 10 мин.",
  category: "debuff",
  powerType: "flat",
  target: "enemy",
  scope: "single",
  castTime: 1.8,
  cooldown: 600, // 10 хвилин
  duration: 120, // 2 хвилини
  icon: "/skills/skill0342.gif",
  hpCost: 1004, // З XML: hpConsume="1004"
  hpThreshold: 0.75, // Тільки коли HP <= 75%
  effects: [
    { stat: "maxCp", mode: "percent", value: -90, duration: 120 }, // Зменшує maxCp до 10% (множник 0.1)
    { stat: "debuffResist", mode: "percent", value: -30, duration: 120 }, // Збільшує вразливість до дебафів на 30%
    { stat: "healPower", mode: "percent", value: -30, duration: 120 }, // Зменшує ефективність відновлення HP на 30%
  ],
  levels: [
    { level: 1, requiredLevel: 78, spCost: 32000000, mpCost: 0, power: 90 },
  ],
};

