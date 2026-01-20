// Політика синхронізації localStorage ↔ server
// Визначає, хто новіший і як вирішувати конфлікти

import type { Hero } from "../../types/Hero";
import { Character } from "../../utils/api";

export interface SyncConflict {
  hasConflict: boolean;
  serverNewer: boolean;
  localNewer: boolean;
  serverRevision?: number;
  localRevision?: number;
  serverUpdatedAt?: string;
  localUpdatedAt?: number;
}

/**
 * Перевіряє конфлікт між серверною та локальною версією героя
 */
export function checkSyncConflict(
  serverCharacter: Character | null,
  localHero: Hero | null
): SyncConflict {
  // Якщо немає серверної версії - немає конфлікту
  if (!serverCharacter) {
    return { hasConflict: false, serverNewer: false, localNewer: false };
  }

  // Якщо немає локальної версії - немає конфлікту
  if (!localHero) {
    return { hasConflict: false, serverNewer: false, localNewer: false };
  }

  const serverHeroJson = serverCharacter.heroJson as any || {};
  const serverRevision = serverHeroJson.heroRevision || 0;
  const serverUpdatedAt = serverCharacter.updatedAt ? new Date(serverCharacter.updatedAt).getTime() : 0;

  const localRevision = (localHero as any).heroRevision || 0;
  const localUpdatedAt = (localHero as any).lastSavedAt || 0; // Потрібно додати lastSavedAt при збереженні

  // Перевіряємо ревізії (найточніший спосіб)
  if (serverRevision > 0 && localRevision > 0) {
    if (serverRevision !== localRevision) {
      return {
        hasConflict: true,
        serverNewer: serverRevision > localRevision,
        localNewer: localRevision > serverRevision,
        serverRevision,
        localRevision,
        serverUpdatedAt: serverCharacter.updatedAt,
        localUpdatedAt,
      };
    }
  }

  // Fallback на updatedAt (якщо ревізій немає)
  if (serverUpdatedAt > 0 && localUpdatedAt > 0) {
    if (Math.abs(serverUpdatedAt - localUpdatedAt) > 1000) { // Різниця більше 1 секунди
      return {
        hasConflict: true,
        serverNewer: serverUpdatedAt > localUpdatedAt,
        localNewer: localUpdatedAt > serverUpdatedAt,
        serverUpdatedAt: serverCharacter.updatedAt,
        localUpdatedAt,
      };
    }
  }

  // Немає конфлікту
  return { hasConflict: false, serverNewer: false, localNewer: false };
}

/**
 * Визначає, яку версію використовувати при конфлікті
 * 
 * ❗ ПОЛІТИКА БЕЗПЕКИ:
 * - Server завжди перемагає (last-write-wins на сервері)
 * - Local версія зберігається як backup перед заміною
 * - Немає "тихої" автозаміни - завжди логується конфлікт
 */
export function resolveSyncConflict(conflict: SyncConflict): "server" | "local" | "ask" {
  if (!conflict.hasConflict) {
    return "server"; // За замовчуванням використовуємо server
  }

  // ❗ ВАЖЛИВО: Server завжди перемагає для безпеки
  // Якщо local новіший - це може бути через:
  // 1. Баг/корупцію localStorage
  // 2. Не збережені зміни (але вони мають бути на server через optimistic locking)
  // 3. Зміни в офлайн режимі (не підтримується)
  
  // Тому завжди використовуємо server, але зберігаємо local як backup
  return "server";
}

/**
 * Зберігає локальну версію як backup перед заміною на серверну
 */
export function saveLocalBackup(localHero: Hero | null, conflict: SyncConflict): void {
  if (!localHero || !conflict.hasConflict || !conflict.localNewer) {
    return; // Немає сенсу зберігати backup
  }

  try {
    // ❗ ВАЖЛИВО: Зберігаємо достатній контекст для відновлення
    const backupData = {
      hero: localHero,
      conflict,
      savedAt: Date.now(),
      // Додаємо контекст для ідентифікації
      characterId: (localHero as any).id || (localHero as any).name || 'unknown',
      heroRevision: conflict.localRevision || (localHero as any).heroRevision || 0,
      updatedAt: conflict.localUpdatedAt || (localHero as any).lastSavedAt || Date.now(),
      serverRevision: conflict.serverRevision || 0,
      serverUpdatedAt: conflict.serverUpdatedAt || null,
    };
    
    // Зберігаємо в localStorage (FIFO - найстаріші видаляються)
    const backups = JSON.parse(localStorage.getItem('hero_backups') || '[]');
    backups.push(backupData);
    
    // ❗ ВАЖЛИВО: FIFO - зберігаємо тільки останні 5 backup-ів (найстаріші видаляються)
    // Це гарантує, що localStorage не розростається
    if (backups.length > 5) {
      backups.shift(); // Видаляємо найстаріший
    }
    
    localStorage.setItem('hero_backups', JSON.stringify(backups));
    console.warn('[syncPolicy] Local version saved as backup due to conflict:', {
      characterId: backupData.characterId,
      localRevision: backupData.heroRevision,
      serverRevision: backupData.serverRevision,
      savedAt: new Date(backupData.savedAt).toISOString(),
    });
  } catch (error) {
    console.error('[syncPolicy] Failed to save local backup:', error);
    // Якщо localStorage переповнений - спробуємо очистити старі backup-и
    try {
      const backups = JSON.parse(localStorage.getItem('hero_backups') || '[]');
      if (backups.length > 0) {
        backups.shift(); // Видаляємо найстаріший
        localStorage.setItem('hero_backups', JSON.stringify(backups));
        // Повторюємо спробу збереження
        const backupData = {
          hero: localHero,
          conflict,
          savedAt: Date.now(),
          characterId: (localHero as any).id || (localHero as any).name || 'unknown',
          heroRevision: conflict.localRevision || (localHero as any).heroRevision || 0,
          updatedAt: conflict.localUpdatedAt || (localHero as any).lastSavedAt || Date.now(),
          serverRevision: conflict.serverRevision || 0,
          serverUpdatedAt: conflict.serverUpdatedAt || null,
        };
        backups.push(backupData);
        localStorage.setItem('hero_backups', JSON.stringify(backups));
      }
    } catch (retryError) {
      console.error('[syncPolicy] Failed to retry backup save:', retryError);
    }
  }
}

/**
 * Створює повідомлення для користувача про конфлікт
 */
export function getConflictMessage(conflict: SyncConflict): string {
  if (!conflict.hasConflict) {
    return "";
  }

  if (conflict.serverNewer) {
    return "Серверна версія персонажа новіша за локальну. Буде завантажена серверна версія.";
  }

  if (conflict.localNewer) {
    return "Локальна версія персонажа новіша за серверну. Можливо, зміни не були збережені на сервері.";
  }

  return "Виявлено конфлікт версій персонажа.";
}
