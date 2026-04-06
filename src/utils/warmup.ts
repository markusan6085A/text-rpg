// 🔥 Warm-up utility для підтримки сервера "теплим" (prevent cold start)
// Викликається при завантаженні додатку для "прогріву" сервера

import { upgradeApiBaseForPageProtocol } from "./api/publicApiBase";

const WARMUP_INTERVAL = 4 * 60 * 1000; // 4 хвилини (сервер може засинати після неактивності)

let warmupInterval: number | null = null;

/**
 * Отримує health endpoint URL (динамічно, щоб уникнути проблем з імпортом)
 * ❗ Не використовуємо імпорт API_URL, щоб уникнути циклічних залежностей
 */
function getHealthEndpoint(): string {
  try {
    const raw =
      (typeof window !== "undefined" && (window as any).__API_URL__) ||
      import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";
    const apiUrl = upgradeApiBaseForPageProtocol(String(raw));
    return `${apiUrl}/health`;
  } catch (err) {
    const fallback = upgradeApiBaseForPageProtocol(
      import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:3000"
    );
    return `${fallback}/health`;
  }
}

/**
 * Пінг health endpoint для підтримки сервера активним
 * Викликається в фоні, не блокує UI
 */
export function pingHealth(): void {
  try {
    const endpoint = getHealthEndpoint();
    // ❗ Fire-and-forget: не await, не блокує UI
    fetch(endpoint)
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
  } catch (err) {
    // Ігноруємо помилки - не критично
    if (import.meta.env.DEV) {
      console.warn('[warmup] Failed to ping health (non-critical):', err);
    }
  }
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
