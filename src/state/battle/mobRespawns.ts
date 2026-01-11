// src/state/battle/mobRespawns.ts
// Система респавну мобів: зберігаємо timestamp респавну для кожного моба

import { getJSON, setJSON } from "../persistence";

// Ключ для зберігання респавнів (залежить від ніку героя)
const getRespawnKey = (heroName?: string | null): string => {
  if (heroName) {
    return `l2_mob_respawns_${heroName}`;
  }
  return "l2_mob_respawns";
};

// Тип для респавнів: ключ = "zoneId_mobIndex", значення = timestamp респавну
export type MobRespawns = Record<string, number>;

// Завантажуємо респавни для героя
export const loadMobRespawns = (heroName?: string | null): MobRespawns => {
  const key = getRespawnKey(heroName);
  const respawns = getJSON<MobRespawns>(key, {});
  
  // Очищаємо застарілі респавни (старіше 5 хвилин)
  const now = Date.now();
  const cleaned: MobRespawns = {};
  for (const [mobKey, respawnAt] of Object.entries(respawns)) {
    if (respawnAt > now) {
      // Респавн ще не настав
      cleaned[mobKey] = respawnAt;
    }
    // Інакше пропускаємо (респавн вже настав або застарів)
  }
  
  // Зберігаємо очищені дані
  if (Object.keys(cleaned).length !== Object.keys(respawns).length) {
    setJSON(key, cleaned);
  }
  
  return cleaned;
};

// Зберігаємо респавн для моба
export const setMobRespawn = (
  zoneId: string,
  mobIndex: number,
  respawnDelayMs: number,
  heroName?: string | null
): void => {
  const key = getRespawnKey(heroName);
  const respawns = loadMobRespawns(heroName);
  const mobKey = `${zoneId}_${mobIndex}`;
  const respawnAt = Date.now() + respawnDelayMs;
  
  respawns[mobKey] = respawnAt;
  setJSON(key, respawns);
};

// Перевіряємо, чи моб на респавні
export const isMobOnRespawn = (
  zoneId: string,
  mobIndex: number,
  heroName?: string | null
): boolean => {
  const respawns = loadMobRespawns(heroName);
  const mobKey = `${zoneId}_${mobIndex}`;
  const respawnAt = respawns[mobKey];
  
  if (!respawnAt) return false;
  
  const now = Date.now();
  return respawnAt > now; // Респавн ще не настав
};

// Отримуємо час до респавну в секундах
export const getRespawnTimeRemaining = (
  zoneId: string,
  mobIndex: number,
  heroName?: string | null
): number => {
  const respawns = loadMobRespawns(heroName);
  const mobKey = `${zoneId}_${mobIndex}`;
  const respawnAt = respawns[mobKey];
  
  if (!respawnAt) return 0;
  
  const now = Date.now();
  const remaining = respawnAt - now;
  
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

// Очищаємо респавн моба (коли він респавнувся)
export const clearMobRespawn = (
  zoneId: string,
  mobIndex: number,
  heroName?: string | null
): void => {
  const key = getRespawnKey(heroName);
  const respawns = loadMobRespawns(heroName);
  const mobKey = `${zoneId}_${mobIndex}`;
  
  if (respawns[mobKey]) {
    delete respawns[mobKey];
    setJSON(key, respawns);
  }
};

// Допоміжна функція для очищення респавну боса по ID (для консолі браузера)
export const clearBossRespawnById = (bossId: string, heroName?: string | null): void => {
  // Мапінг ID босів на їх індекси в зонах
  const bossMap: Record<string, { zoneId: string; mobIndex: number }> = {
    "rb_floran_death_sorcerer": { zoneId: "floran_raid_lair", mobIndex: 8 },
    // Додай інші боси за потреби
  };
  
  const bossInfo = bossMap[bossId];
  if (bossInfo) {
    clearMobRespawn(bossInfo.zoneId, bossInfo.mobIndex, heroName);
    console.log(`✅ Респавн для ${bossId} очищено!`);
  } else {
    console.log(`❌ Бос ${bossId} не знайдено в мапінгу.`);
  }
};

