import { SkillDefinition } from "../../../types";

// Zealot для Destroyer
// By the will of a Guardian God, you instantly and significantly increase your fighting ability.
// While in use, the effects of HP regeneration magic significantly decreases.
// This skill is only available when your HP is at 30% or lower. Effect 1.
// З XML: pAtkSpd=1.1/1.2/1.3 (+10/20/30%), runSpd=10/20/30, rCrit=33/66/100, cAtk=1.33/1.66/2.0 (+33/66/100%)
// hpConsume=159/183/204, mpConsume=106/122/136
const attackSpeedValues = [10, 20, 30]; // +10%, +20%, +30% для рівнів 1, 2, 3
const runSpeedValues = [10, 20, 30]; // +10, +20, +30 для рівнів 1, 2, 3
const critRateValues = [33, 66, 100]; // +33, +66, +100 для рівнів 1, 2, 3 (для мечів/списів)
const critDamageValues = [33, 66, 100]; // +33%, +66%, +100% для рівнів 1, 2, 3 (для тупого/кулаків)

export const Skill_0420: SkillDefinition = {
  id: 420,
  code: "OR_0420",
  name: "Zealot",
  description: "By the will of a Guardian God, you instantly and significantly increase your fighting ability. While in use, the effects of HP regeneration magic significantly decreases. This skill is only available when your HP is at 30% or lower. Effect 1.\n\nПо воле Бога-Покровителя, вы мгновенно и значительно увеличиваете свою боевую способность. Во время использования эффект магии регенерации HP значительно уменьшается. Этот скіл можно использовать только когда HP составляет 30% или ниже. Эффект 1. Увеличивает скорость атаки на 10-30% (зависит от уровня), скорость передвижения на 10-30 (зависит от уровня), точность на 6, критическую атаку на 33-100 (для мечей/списов) или 33-100% (для тупого/кулаків, зависит от уровня). Увеличивает вразливость к дебафам на 80 и к отмене на 40. Уменьшает регенерацию HP до 50%. Длительность: 60 сек. Каст: 2 сек. Перезарядка: 15 мин. Требуется HP ≤ 30%.",
  category: "buff",
  powerType: "none",
  target: "self",
  scope: "single",
  castTime: 2,
  cooldown: 900, // 15 хвилин (900000 мс = 900 сек)
  duration: 60, // 60 секунд
  icon: "/skills/skill0420.gif",
  hpThreshold: 0.3, // 30% HP
  hpCost: 159, // Базовий витрата HP (для рівня 1), для рівня 2 буде 183, для рівня 3 буде 204
  effects: [
    // Використовуємо power для attackSpeed та runSpeed
    { stat: "atkSpeed", mode: "percent" }, // +10-30% швидкості атаки (береться з power)
    { stat: "runSpeed", mode: "flat" }, // +10-30 швидкості бігу (береться з power)
    // Фіксовані значення для всіх рівнів
    { stat: "accuracy", mode: "flat", value: 6 }, // +6 точності
    { stat: "hpRegen", mode: "multiplier", multiplier: 0.5 }, // Зменшує регенерацію HP до 50%
    { stat: "debuffResist", mode: "flat", value: -80 }, // Збільшує вразливість до дебафів на 80 (debuffVuln +80)
    { stat: "cancelResist", mode: "flat", value: -40 }, // Збільшує вразливість до скасування на 40 (cancelVuln +40)
    // Для critRate та critDamage використовуємо середнє значення
    // Примітка: оскільки power використовується для attackSpeed/runSpeed, для critRate/critDamage використовуємо середнє значення
    { stat: "critRate", mode: "flat", value: 66 }, // +66 критичної атаки для мечів/списів (середнє значення: 33/66/100)
    { stat: "critDamage", mode: "percent", value: 66 }, // +66% критичної атаки для тупого/кулаків (середнє значення: 33/66/100)
  ],
  levels: [
    // Рівень 1: pAtkSpd=1.1 (+10%), runSpd=10, rCrit=33, cAtk=1.33 (+33%)
    // hpConsume=159, mpConsume=106
    // power=10 використовується для attackSpeed (+10%) та runSpeed (+10)
    { level: 1, requiredLevel: 58, spCost: 200000, mpCost: 106, power: 10, hpCost: 159 },
    // Рівень 2: pAtkSpd=1.2 (+20%), runSpd=20, rCrit=66, cAtk=1.66 (+66%)
    // hpConsume=183, mpConsume=122
    { level: 2, requiredLevel: 68, spCost: 650000, mpCost: 122, power: 20, hpCost: 183 },
    // Рівень 3: pAtkSpd=1.3 (+30%), runSpd=30, rCrit=100, cAtk=2.0 (+100%)
    // hpConsume=204, mpConsume=136
    { level: 3, requiredLevel: 74, spCost: 1200000, mpCost: 136, power: 30, hpCost: 204 },
  ],
};

