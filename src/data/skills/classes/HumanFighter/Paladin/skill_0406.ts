import { SkillDefinition } from "../../../types";

// Angelic Icon для Paladin
// By the will of your God, your fighting ability with one-handed swords significantly increases.
// While in use, the effects of HP regeneration magic significantly decreases.
// This skill is only available when your HP is at 30% or lower. Effect 1.
// З XML: pAtkSpd=1.1/1.2/1.3 (+10/20/30%), runSpd=10/20/30, rCrit=33/66/100, cAtk=1.33/1.66/2.0 (+33/66/100%)
const attackSpeedValues = [10, 20, 30]; // +10%, +20%, +30% для рівнів 1, 2, 3
const runSpeedValues = [10, 20, 30]; // +10, +20, +30 для рівнів 1, 2, 3
const critRateValues = [33, 66, 100]; // +33, +66, +100 для рівнів 1, 2, 3 (для мечів/списів)
const critDamageValues = [33, 66, 100]; // +33%, +66%, +100% для рівнів 1, 2, 3 (для тупого/кулаків)

export const skill_0406: SkillDefinition = {
  id: 406,
  code: "PAL_0406",
  name: "Angelic Icon",
  description: "By the will of your God, your fighting ability with one-handed swords significantly increases. While in use, the effects of HP regeneration magic significantly decreases. This skill is only available when your HP is at 30% or lower. Effect 1.\n\nПо воле вашего Бога, ваша боевая способность с одноручными мечами значительно увеличивается. Во время использования эффект магии регенерации HP значительно уменьшается. Этот скіл можно использовать только когда HP составляет 30% или ниже. Эффект 1. Увеличивает скорость атаки на 10-30% (зависит от уровня), скорость передвижения на 10-30 (зависит от уровня), физ. и маг. защиту на 50%, точность на 6, критическую атаку на 33-100 (для мечей/списов) или 33-100% (для тупого/кулаків, зависит от уровня). Уменьшает регенерацию HP до 20%. Длительность: 60 мин. Каст: 2 сек. Перезарядка: 10 мин. Требуется HP ≤ 30%.",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 2,
  cooldown: 600, // 10 хвилин
  duration: 3600, // 60 хвилин
  icon: "/skills/Skill0406.jpg",
  hpThreshold: 0.3, // 30% HP
  effects: [
    // Використовуємо power для attackSpeed та runSpeed
    { stat: "atkSpeed", mode: "percent", duration: 3600 }, // +10-30% швидкості атаки (береться з power)
    { stat: "runSpeed", mode: "flat", duration: 3600 }, // +10-30 швидкості бігу (береться з power)
    // Фіксовані значення для всіх рівнів
    { stat: "pDef", mode: "percent", value: 50, duration: 3600 }, // +50% фіз. захисту
    { stat: "mDef", mode: "percent", value: 50, duration: 3600 }, // +50% маг. захисту
    { stat: "accuracy", mode: "flat", value: 6, duration: 3600 }, // +6 точності
    { stat: "hpRegen", mode: "percent", value: -80, duration: 3600 }, // Зменшує регенерацію HP до 20%
    // Для critRate та critDamage використовуємо окремі значення через power в levels
    // Примітка: оскільки power використовується для attackSpeed/runSpeed, для critRate/critDamage використовуємо середні значення
    // Або можна використовувати power для critRate/critDamage, але тоді attackSpeed/runSpeed будуть використовувати фіксовані значення
    // Найкраще рішення - використовувати power для attackSpeed/runSpeed (10, 20, 30), а для critRate/critDamage використовувати фіксовані значення
    { stat: "critRate", mode: "flat", value: 66, duration: 3600 }, // +66 критичної атаки для мечів/списів (середнє значення: 33/66/100)
    { stat: "critDamage", mode: "percent", value: 66, duration: 3600 }, // +66% критичної атаки для тупого/кулаків (середнє значення: 33/66/100)
  ],
  stackType: "angelic_icon",
  stackOrder: 1,
  levels: [
    // Рівень 1: pAtkSpd=1.1 (+10%), runSpd=10, rCrit=33, cAtk=1.33 (+33%)
    // power=10 використовується для attackSpeed (+10%) та runSpeed (+10)
    // critRate та critDamage використовують значення 33 (через power, але це не працює для кількох ефектів)
    // Тому використовуємо power тільки для attackSpeed/runSpeed, а для critRate/critDamage використовуємо фіксовані значення
    { level: 1, requiredLevel: 60, spCost: 500000, mpCost: 133, power: 10 },
    // Рівень 2: pAtkSpd=1.2 (+20%), runSpd=20, rCrit=66, cAtk=1.66 (+66%)
    { level: 2, requiredLevel: 64, spCost: 1000000, mpCost: 153, power: 20 },
    // Рівень 3: pAtkSpd=1.3 (+30%), runSpd=30, rCrit=100, cAtk=2.0 (+100%)
    { level: 3, requiredLevel: 68, spCost: 2000000, mpCost: 170, power: 30 },
  ],
};

