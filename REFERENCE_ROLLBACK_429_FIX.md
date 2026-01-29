# Референс: відкати та 429 — ключові шматки коду

Один файл з усіма фрагментами для прибивання відкатів прогресу та 429 Too Many Requests.

---

## 1) Frontend: polling + старт апки

### src/main.tsx (StrictMode / рендер)

- **StrictMode вимкнено** — подвійні рендери в dev давали подвійні запити.
- Рендер: `ReactDOM.createRoot(...).render(<App />)` без `<React.StrictMode>`.

```tsx
// src/main.tsx
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // StrictMode викликає подвійні рендери в dev, що призводить до подвійних запитів
  <App />
);
```

---

### src/App.tsx (loadHeroFromAPI / loadHero / setHero)

- **Де викликається:** один раз у `useEffect` при старті (важкі сторінки — `await loadHeroFromAPI()` перед UI; легкі — `setTimeout(..., 500)` і load у фоні).
- **setHero:** тільки після `loadHeroFromAPI()` або при логіні (`onLogin`). **Local-first:** якщо локальний прогрес ≥ серверного (exp/level/sp/adena/mobsKilled), у store ставиться `hydrateHero(localHero)`, інакше — `loadedHero`. При помилці API — `loadHero()` (localStorage).
- **Важливо:** App ніколи не пише в localStorage; запис — тільки в heroStore/heroPersistence.

```tsx
// Критичні фрагменти з App.tsx
// Початок завантаження (важкі сторінки):
if (authStore.isAuthenticated && characterStore.characterId) {
  const loadedHero = await loadHeroFromAPI();
  if (loadedHero && alive) {
    const localHero = getHeroFromLocalStorage();
    const le = Number((localHero as any)?.exp ?? ...);
    const re = Number(loadedHero.exp ?? 0);
    // ... ll, ls, la, lm vs rl, rs, ra, rm
    const localBetterOrEqual = localHero && (le > re || ... || (le >= re && ll >= rl && ...));
    setHero(localBetterOrEqual ? (hydrateHero(localHero) ?? loadedHero) : loadedHero);
  } else if (alive) loadHero();
}
// При логіні:
onLogin={(loadedHero) => { setJSON("l2_current_user", loadedHero.username); setHero(loadedHero); navigate("/city"); }}
```

---

### src/components/Layout.tsx (online + heartbeat + battle timer)

- **Online:** перший виклик через 15 с (легкі сторінки 5 с), далі кожні 60 с. Перед викликом: `if (getRateLimitRemainingMs() > 0) return;`.
- **Heartbeat:** перший через 20 с, далі кожні 4 хв. Те саме — guard cooldown.
- **Battle timer:** `setInterval(..., 1000)` тільки коли `battleStatus === "fighting"` (regenTick + processMobAttack).
- **Банер 429:** `cooldownSec = getRateLimitRemainingMs()` оновлюється кожну секунду; якщо `cooldownSec > 0` — показується "Забагато запитів. Зачекайте X сек."

```tsx
// Layout.tsx — online
const loadOnlineCount = () => {
  if (getRateLimitRemainingMs() > 0) return;
  getOnlinePlayers().then(...)
};
const delay = isLightPage ? 5000 : 15000;
setTimeout(loadOnlineCount, delay);
if (!isLightPage) setInterval(loadOnlineCount, 60000);

// Layout.tsx — heartbeat
const sendHeartbeatInterval = () => {
  if (getRateLimitRemainingMs() > 0) return;
  sendHeartbeat().then(...)
};
setTimeout(sendHeartbeatInterval, 20000);
setInterval(sendHeartbeatInterval, 4 * 60 * 1000);
```

---

### src/components/NavGrid.tsx (unread / clan unread)

- **Unread:** перший виклик через 15 с, далі кожні 60 с. Guard: `if (getRateLimitRemainingMs() > 0) return;` перед `getUnreadCount()`.
- **Clan unread:** перший через 20 с, далі кожні 60 с, той самий guard перед `getMyClan()` / `getClanChat()`.

```tsx
// NavGrid.tsx
const loadUnreadCount = async () => {
  if (getRateLimitRemainingMs() > 0) return;
  const data = await getUnreadCount();
  setUnreadCount(data.unreadCount || 0);
};
setTimeout(loadUnreadCount, 15000);
setInterval(loadUnreadCount, 60000);
// clan: setTimeout(loadClanUnreadCount, 20000); setInterval(loadClanUnreadCount, 60000);
```

---

### src/screens/OnlinePlayers.tsx (polling online list)

- При mount викликається `loadOnlinePlayers()` і далі кожні 60 с. У `loadOnlinePlayers`: `if (getRateLimitRemainingMs() > 0) return;` перед `getOnlinePlayers()`.

```tsx
// OnlinePlayers.tsx
const loadOnlinePlayers = React.useCallback(async () => {
  if (getRateLimitRemainingMs() > 0) return;
  const data = await getOnlinePlayers();
  setPlayers(data.players || []);
}, []);
useEffect(() => { loadOnlinePlayers(); const interval = setInterval(loadOnlinePlayers, 60000); return () => clearInterval(interval); }, [loadOnlinePlayers]);
```

---

### src/screens/Mail.tsx (polling)

- Листи завантажуються при зміні `page`; окремий interval кожні 60 с для `getOnlinePlayers()` для бейджів онлайн. У callback: `if (getRateLimitRemainingMs() > 0) return;` перед викликами API.

```tsx
// Mail.tsx — online players interval
useEffect(() => {
  const interval = setInterval(async () => {
    if (getRateLimitRemainingMs() > 0) return;
    const data = await getOnlinePlayers();
    setOnlinePlayerIds(new Set(data.players?.map(p => p.id) || []));
  }, 60000);
  return () => clearInterval(interval);
}, []);
```

---

### src/components/StatusBars.tsx (реген HP/MP/CP)

- Реген раз на секунду тільки поза боєм (`inBattle === false`). **Throttle:** оновлення store (updateHero) не кожну секунду, а раз на 5 с (накопичення в `regenThrottleRef.pendingUpdates`). Якщо ресурси вже на максимумі — updateHero не викликається. Клан для емблеми — один раз при зміні `hero?.name`, без polling.

```tsx
// StatusBars.tsx — реген з throttle 5s
const REGEN_UPDATE_INTERVAL_MS = 5000;
// В setInterval(1000): обчислюємо nextHp/nextMp/nextCp; якщо не atMax — мержимо в pendingUpdates;
// якщо timeSinceLastUpdate >= REGEN_UPDATE_INTERVAL_MS або updates.equipment (Зарич) — викликаємо updateHero(pendingUpdates).
// Cleanup: якщо pendingUpdates — updateHero(pendingUpdates) перед clearInterval.
```

---

### src/screens/City.tsx

- Регенерації HP/MP/CP тут немає — лише відображення. Реген тільки в StatusBars.

```tsx
// City.tsx — коментар у коді:
// 🔥 ВИДАЛЕНО: Регенерація HP/MP/CP - вона вже є в StatusBars (глобальний компонент)
```

---

## 2) Frontend: збереження/завантаження героя

### src/state/heroStore.ts

- **Debounce:** SAVE_DEBOUNCE_MS = 10000; debouncedSave(hero) — через 10 с після останнього оновлення.
- **Rate limit cooldown:** rateLimitUntil, setRateLimitCooldown(durationMs), getRateLimitRemainingMs(). При 429 в api.ts викликається setRateLimitCooldown(sec * 1000).
- **Critical save:** immediateSave(hero) для змін mobsKilled, skills, sp, profession, inventory, equipment, adena, coinOfLuck, aa, level, exp, heroJson.heroBuffs. Якщо зараз cooldown — hero кладеться в criticalSaveQueue, планується scheduleCriticalSaveAfterCooldown(); локально одразу saveHeroToLocalStorageOnly(hero).
- **updateHero(partial):** завжди saveHeroToLocalStorageOnly(updated); якщо isCriticalChange — immediateSave(updated), інакше debouncedSave(updated).

```ts
// heroStore.ts — константи та cooldown
const SAVE_DEBOUNCE_MS = 10000;
let rateLimitUntil = 0;
const RATE_LIMIT_COOLDOWN_MS = 60000;
export function setRateLimitCooldown(durationMs = RATE_LIMIT_COOLDOWN_MS) { rateLimitUntil = Date.now() + durationMs; ... }
export function getRateLimitRemainingMs() { return rateLimitUntil > Date.now() ? rateLimitUntil - Date.now() : 0; }

// debouncedSave: якщо now < rateLimitUntil — return; інакше pendingSave = hero, setTimeout(..., SAVE_DEBOUNCE_MS) -> saveHeroToLocalStorage(pendingSave).
// immediateSave: якщо cooldown — criticalSaveQueue = hero, scheduleCriticalSaveAfterCooldown(), saveHeroToLocalStorageOnly(hero), return; інакше clear saveTimeout, saveHeroToLocalStorage(hero).catch(... 429 -> setRateLimitCooldown, criticalSaveQueue = hero).
// updateHero: set({ hero: updated }); saveHeroToLocalStorageOnly(updated); isCriticalChange ? immediateSave(updated) : debouncedSave(updated).
```

---

### src/state/heroStore/heroPersistence.ts

- **Save mutex:** saving; якщо saving — queued = true, return. Після saveHeroOnce у finally якщо queued — setTimeout(..., 100) знову saveHeroToLocalStorage(currentHero з store).
- **Queued save:** один наступний save бере поточного героя з store (не старий snapshot).
- **Перед PUT:** якщо getRateLimitRemainingMs() > 0 — тільки запис у localStorage, без PUT, return.
- **Clamp:** exp/sp при відправці беруться max(local, serverKnown); level не clamp’иться на клієнті — сервер source of truth.
- **429:** catch 429 → retryAfter з error, setRateLimitCooldown(cooldownMs), запис у localStorage, не кидати далі.
- **409:** revision conflict → один retry: GET character, merge local/server (exp, mobsKilled, skills, buffs — max/merge), setHero(merged), saveHeroOnce(merged). Якщо знову 409 — alert і backup у localStorage.

```ts
// heroPersistence.ts
let saving = false, queued = false;
// saveHeroToLocalStorage: if (saving) { queued = true; return; } saving = true; await saveHeroOnce(hero); finally { saving = false; if (queued) { queued = false; setTimeout(() => saveHeroToLocalStorage(useHeroStore.getState().hero), 100); } }

// saveHeroOnce: якщо getRateLimitRemainingMs() > 0 — тільки localStorage, return.
// Відправка: expToSend = max(localExp, serverExpKnown), spToSend = max(localSp, serverSpKnown), levelToSend = localLevel.
// catch 429: setRateLimitCooldown(retryAfter*1000), save to localStorage, return.
// catch 409: GET character, merge exp/mobsKilled/skills/buffs, setHero(merged), await saveHeroOnce(merged). MAX_RETRIES = 1.
```

---

### src/state/heroStore/heroLoadAPI.ts

- **Local-first:** спочатку loadHero() з localStorage, hydrateHero(local). Якщо getRateLimitRemainingMs() > 0 — повертаємо hydrated local, без GET.
- **Після GET:** порівняння local vs server (exp, level, sp, adena, mobsKilled, skillLevelsSum, lastSavedAt vs updatedAt, локальні активні бафи). Якщо localHasMoreProgress — повертаємо hydratedLocalHero і в фоні saveHeroToLocalStorage(hydratedLocalHero).
- **Heartbeat:** не викликається тут; тільки в Layout.

```ts
// heroLoadAPI.ts
export async function loadHeroFromAPI(): Promise<Hero | null> {
  if (getRateLimitRemainingMs() > 0) { const localHero = loadHero(); return hydrateHero(localHero) ?? null; }
  const localHero = loadHero(), hydratedLocalHero = hydrateHero(localHero);
  try { character = await getCharacter(...); } catch (e) { if (e?.status === 429) return hydratedLocalHero ?? null; throw e; }
  // Порівняння: localExp, serverExp, localLevel, serverLevel, ... localHasMoreProgress.
  if (localHasMoreProgress) { saveHeroToLocalStorage(hydratedLocalHero).catch(...); return hydratedLocalHero; }
  // Далі побудова fixedHero з character + heroJson, recalc stats, hydrateHero, updateServerState(...), return hydratedHero.
}
```

---

### src/state/heroStore/heroLoad.ts

- **Що читає:** l2_current_user, l2_accounts_v2, acc.hero для поточного юзера. fixProfession, міграції (Angel Slayer тощо). hero.* має пріоритет над heroJson (exp, level, sp, adena, mobsKilled, skills). Recalc stats, buffedMax, finalHp/Mp/Cp. hydrateHero(heroWithRecalculatedStats).
- **Що не робить:** не пише hero в localStorage (запис тільки в heroPersistence).

```ts
// heroLoad.ts
export function loadHero(): Hero | null {
  const username = getJSON("l2_current_user", null);
  const accounts = getJSON("l2_accounts_v2", []);
  const acc = accounts.find(a => a.username === username);
  if (acc?.hero) {
    const fixedHero = fixHeroProfession(acc.hero);
    const heroJson = fixedHero.heroJson || {};
    if (fixedHero.exp === undefined) fixedHero.exp = Number(heroJson.exp ?? 0);
    // ... level, sp, adena, mobsKilled, skills з hero або heroJson
    // recalc, buffedMax, finalHp/Mp/Cp, return hydrateHero(heroWithRecalculatedStats).
  }
  return null;
}
```

---

### src/state/heroStore/heroHydration.ts

- **Джерело істини:** hero.* (skills, mobsKilled, exp, level). heroJson — копія для серіалізації. hydrateHero(hero) повертає hero з синхронізованим heroJson (name, race, klass, classId, gender, profession, skills, mobsKilled, exp, level).

```ts
// heroHydration.ts
export function hydrateHero(hero: Hero | null): Hero | null {
  if (!hero) return null;
  const hj = hero.heroJson ?? {};
  const skills = Array.isArray(hero.skills) && hero.skills.length > 0 ? hero.skills : (hj.skills ?? []);
  const mobsKilled = hero.mobsKilled ?? hj.mobsKilled ?? 0;
  const exp = hero.exp ?? hj.exp ?? 0;
  const level = hero.level ?? hj.level ?? 1;
  return { ...hero, skills, mobsKilled, exp, level, heroJson: { ...hj, name, race, klass, classId, ..., skills, mobsKilled, exp, level } };
}
```

---

## 3) API client

### src/utils/api.ts (429, retryAfter, один клієнт)

- Всі запити йдуть через одну функцію `apiRequest<T>(endpoint, options)` (fetch з API_URL, Authorization: Bearer token).
- При response.status === 429: парситься retryAfter з body, викликається setRateLimitCooldown(sec * 1000), в error додається retryAfter. Клієнт один — один base URL і один спосіб обробки 429.

```ts
// api.ts — фрагмент apiRequest
if (!response.ok) {
  const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
  const errorWithStatus = new Error(error.error || ...) as any;
  errorWithStatus.status = response.status;
  if (response.status === 429) {
    const retryAfter = Number((error as any).retryAfter);
    const sec = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60;
    try { const mod = await import('../state/heroStore'); mod.setRateLimitCooldown(sec * 1000); } catch (_) {}
    errorWithStatus.retryAfter = sec;
  }
  throw errorWithStatus;
}
```

---

## 4) Backend

### server/src/characters.ts

- **GET /characters/:id** — повертає character (id, name, race, classId, sex, level, exp, sp, adena, aa, coinLuck, heroJson, createdAt, updatedAt). Без rate limit middleware на GET.
- **PUT /characters/:id** — оновлення персонажа. **Rate limit:** preHandler: `rateLimitMiddleware(rateLimiters.characterUpdate, "character-update")`. Валідація: level/exp/sp/adena/aa/coinLuck не зменшуються. Optimistic locking по expectedRevision; при конфлікті — 409 з currentRevision та serverState.
- **POST /characters/heartbeat** — оновлення lastActivityAt для першого персонажа акаунта. Без окремого rate limit (загальний застосовується лише до PUT у цьому файлі).
- **GET /characters/online** — список персонажів з lastActivityAt за останні 10 хв. Без окремого rate limit.

```ts
// server/src/characters.ts
// GET /characters/:id — без rate limit
app.get("/characters/:id", async (req, reply) => { ... });

// PUT /characters/:id — з rate limit
app.put("/characters/:id", {
  preHandler: async (req, reply) => {
    await rateLimitMiddleware(rateLimiters.characterUpdate, "character-update")(req, reply);
  },
}, async (req, reply) => { ... });

// POST /characters/heartbeat
app.post("/characters/heartbeat", async (req, reply) => { ... });

// GET /characters/online
app.get("/characters/online", async (req, reply) => { ... });
```

---

### server/src/rateLimiter.ts (налаштування лімітів)

- **characterUpdate:** 30 запитів на 60 с (на ключ — account або IP). При перевищенні — 429 + header Retry-After (секунди до resetAt). Інші лімітери: auth 5/хв, register 3/хв, chat 10/хв, letters 5/хв.

```ts
// server/src/rateLimiter.ts
export const rateLimiters = {
  auth: new RateLimiter(60 * 1000, 5),
  register: new RateLimiter(60 * 1000, 3),
  chat: new RateLimiter(60 * 1000, 10),
  letters: new RateLimiter(60 * 1000, 5),
  characterUpdate: new RateLimiter(60 * 1000, 30), // 30 оновлень на хвилину
};
// rateLimitMiddleware при !result.allowed: reply.header("Retry-After", String(retryAfter)); reply.code(429).send({ error: "rate_limit_exceeded", retryAfter, ... });
```

---

### server/src/index.ts

- Rate limit не підключається глобально в index.ts — тільки через preHandler на конкретних роутах (наприклад PUT /characters/:id у characters.ts).

---

## Швидкий чеклист

1. **Старт апки:** main без StrictMode; App — один раз loadHeroFromAPI або loadHero, setHero тільки після порівняння local vs server.
2. **Polling:** Layout (online, heartbeat), NavGrid (unread, clan), OnlinePlayers, Mail — затримки 15–20 с перший виклик, 60 с або 4 хв інтервал; перед кожним запитом `getRateLimitRemainingMs() > 0` → skip.
3. **Збереження:** heroStore — debounce 10 с, immediateSave для критичних полів, cooldown після 429, criticalSaveQueue + saveHeroToLocalStorageOnly при cooldown. heroPersistence — mutex, queued save, перевірка cooldown перед PUT, clamp exp/sp, обробка 429 (retryAfter, localStorage) і 409 (один retry з merge).
4. **Завантаження:** heroLoadAPI — local-first, при cooldown повертати local без GET; після GET порівняти прогрес, при local краще — повернути local і фоновий save. heroLoad — тільки читання та нормалізація, без запису в localStorage. heroHydration — hero.* = source of truth, heroJson синхронізований.
5. **API:** один apiRequest; при 429 — setRateLimitCooldown(sec*1000), retryAfter у помилці.
6. **Backend:** PUT /characters/:id з rateLimiters.characterUpdate (30/хв); 429 з Retry-After.

Цього достатньо, щоб тримати один референс і перевіряти всі місця при змінах.
