// Мінімальні ліміти
const MIN_CAST_TIME_MS = 300;   // 0.3 сек
const MIN_COOLDOWN_MS = 300;    // 0.3 сек
const BASE_CAST_SPEED = 333;    // Базова швидкість каста (як у L2)

/**
 * Cast speed → час каста
 * Формула: baseMs * (333 / castSpeed)
 * Мінімум: 300ms
 */
export function calcCastTime(
  baseCastSec: number,
  castSpeed: number
): number {
  const baseMs = baseCastSec * 1000;
  if (!castSpeed || castSpeed <= 0) return baseMs;

  const speedMultiplier = BASE_CAST_SPEED / castSpeed;
  const result = baseMs * speedMultiplier;

  return Math.max(MIN_CAST_TIME_MS, Math.round(result));
}

/**
 * Cast speed → cooldown магічних скілів
 * 1. Вплив castSpeed
 * 2. Пасивки на cooldown reduction (-20% і т.д.) працюють ПОВЕРХ castSpeed
 * Мінімум: 300ms
 * 
 * Формула: cdMs = baseCooldownSec * 1000 * (BASE_CAST_SPEED / castSpeed)
 * При castSpeed = 5000: множник = 333 / 5000 = 0.0666
 * Для базового кулдауну 1 сек: 1000 * 0.0666 = 66.6 мс, але мінімум 300 мс
 * 
 * Нова формула для великих значень castSpeed:
 * При castSpeed >= 5000: кулдаун = 0.3 сек (300 мс)
 * При castSpeed < 5000: використовуємо стандартну формулу з обмеженням
 */
export function calcMagicCooldown(
  baseCooldownSec: number,
  castSpeed: number,
  passiveReductionPercent = 0
): number {
  let cdMs = baseCooldownSec * 1000;

  // Діагностика
  if (import.meta.env.DEV) {
    console.log(`[calcMagicCooldown] Input:`, {
      baseCooldownSec,
      castSpeed,
      passiveReductionPercent,
      baseCdMs: cdMs,
    });
  }

  // 1. Вплив castSpeed
  if (castSpeed && castSpeed > 0) {
    // Перевіряємо, чи castSpeed не занадто малий (менше 10) - це може бути помилка
    if (castSpeed < 10) {
      console.warn(`[calcMagicCooldown] Suspicious castSpeed value: ${castSpeed}. Using base value 333.`);
      castSpeed = BASE_CAST_SPEED;
    }
    
    // Якщо castSpeed >= 5000, встановлюємо кулдаун на 0.3 сек (300 мс)
    if (castSpeed >= 5000) {
      cdMs = 300; // 0.3 секунди
      if (import.meta.env.DEV) {
        console.log(`[calcMagicCooldown] castSpeed >= 5000, setting cooldown to 300ms`);
      }
    } else {
      // Для менших значень використовуємо стандартну формулу
      const speedMultiplier = BASE_CAST_SPEED / castSpeed;
      cdMs *= speedMultiplier;
      
      if (import.meta.env.DEV) {
        console.log(`[calcMagicCooldown] After castSpeed:`, {
          speedMultiplier,
          cdMs,
        });
      }
    }
  }

  // 2. Пасивки (-20% і т.д.) працюють ПОВЕРХ castSpeed
  // Але якщо кулдаун вже 300 мс (мінімум), пасивки не можуть його зменшити далі
  if (passiveReductionPercent > 0 && cdMs > MIN_COOLDOWN_MS) {
    const beforeReduction = cdMs;
    cdMs *= (1 - passiveReductionPercent / 100);
    
    if (import.meta.env.DEV) {
      console.log(`[calcMagicCooldown] After passive reduction:`, {
        passiveReductionPercent,
        beforeReduction,
        cdMs,
      });
    }
  }

  const finalCdMs = Math.max(MIN_COOLDOWN_MS, Math.round(cdMs));
  
  if (import.meta.env.DEV) {
    console.log(`[calcMagicCooldown] Final:`, {
      finalCdMs,
      finalCdSec: (finalCdMs / 1000).toFixed(2),
    });
  }

  return finalCdMs;
}


