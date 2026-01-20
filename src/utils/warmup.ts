// 🔥 Warm-up utility для підтримки сервера "теплим" (prevent cold start)
// Викликається при завантаженні додатку для "прогріву" сервера

import { API_URL } from "./api";

const HEALTH_ENDPOINT = `${API_URL}/health`;
const WARMUP_INTERVAL = 4 * 60 * 1000; // 4 хвилини (Railway засинає після ~5 хв)

let warmupInterval: number | null = null;

/**
 * Пінг health endpoint для підтримки сервера активним
 * Викликається в фоні, не блокує UI
 */
export function pingHealth(): void {
  // ❗ Fire-and-forget: не await, не блокує UI
  fetch(HEALTH_ENDPOINT)
    .then(() => {
      if (import.meta.env.DEV) {
        console.log('[warmup] Health ping successful');
      }
    })
    .catch((err) => {
      // Ігноруємо помилки - не критично
      if (import.meta.env.DEV) {
        console.warn('[warmup] Health ping failed (non-critical):', err);
      }
    });
}

/**
 * Запускає періодичний warm-up (кожні 4 хвилини)
 * Викликається один раз при ініціалізації додатку
 */
export function startWarmup(): void {
  // Зупиняємо попередній інтервал, якщо він є
  if (warmupInterval !== null) {
    clearInterval(warmupInterval);
  }

  // Перший ping одразу (якщо сервер вже активний)
  pingHealth();

  // Потім кожні 4 хвилини
  warmupInterval = window.setInterval(pingHealth, WARMUP_INTERVAL);

  if (import.meta.env.DEV) {
    console.log('[warmup] Started warm-up interval (every 4 minutes)');
  }
}

/**
 * Зупиняє warm-up інтервал
 */
export function stopWarmup(): void {
  if (warmupInterval !== null) {
    clearInterval(warmupInterval);
    warmupInterval = null;
    if (import.meta.env.DEV) {
      console.log('[warmup] Stopped warm-up interval');
    }
  }
}
